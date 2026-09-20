#!/usr/bin/env bash
set -uo pipefail
GITHUB_USER="${GITHUB_USER:-mosgaragedev}"
GITHUB_ORG="${GITHUB_ORG:-mosgarage}"
GITHUB_REPO="${GITHUB_REPO:-mosgaragedev}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GIT_BRANCH="${GIT_BRANCH:-main}"
GIT_SYNC_INTERVAL="${GIT_SYNC_INTERVAL:-900}"
WORKSPACE="/app/workspace"
LOG="/var/log/mosgarage/git-sync.log"
TRIGGER="/tmp/mosgarage-git-push-now"
SSH_KEY="/home/mosgarage/.ssh/id_ed25519"
TICK=5
ELAPSED=0

log() { echo "[git-sync] $(date '+%Y-%m-%d %H:%M:%S') $*" | tee -a "$LOG"; }

set_remote() {
  cd "${WORKSPACE}"
  if [[ -f "${SSH_KEY}" ]]; then
    git remote set-url origin "git@github.com:${GITHUB_ORG}/${GITHUB_REPO}.git" 2>/dev/null || true
  elif [[ -n "${GITHUB_TOKEN}" ]]; then
    git remote set-url origin "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_ORG}/${GITHUB_REPO}.git" 2>/dev/null || true
  fi
}

do_sync() {
  local reason="${1:-scheduled}"
  log "── sync [$reason] ──"
  cd "${WORKSPACE}" 2>/dev/null || return 1
  set_remote
  git fetch origin "${GIT_BRANCH}" 2>&1 | tee -a "$LOG" || { log "⚠️  fetch failed"; return 1; }
  local local_sha remote_sha
  local_sha=$(git rev-parse HEAD 2>/dev/null || echo "x")
  remote_sha=$(git rev-parse "origin/${GIT_BRANCH}" 2>/dev/null || echo "y")
  [[ "$local_sha" != "$remote_sha" ]] && git merge "origin/${GIT_BRANCH}" --no-edit 2>&1 | tee -a "$LOG" || true
  git add -A
  if ! git diff --cached --quiet; then
    local files; files=$(git diff --cached --name-only | head -10 | tr '\n' ' ')
    git commit -m "backup: auto-sync $(date '+%Y-%m-%d %H:%M:%S') · ${files}" 2>&1 | tee -a "$LOG"
  fi
  if git push origin "${GIT_BRANCH}" 2>&1 | tee -a "$LOG"; then
    local ts; ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "${ts}" > /var/log/mosgarage/git-last-push.txt
    # Write to Redis if available
    redis-cli -n 1 SET "mosgarage:git:last-push" "${ts}" 2>/dev/null || true
    log "✅ pushed → github.com/${GITHUB_ORG}/${GITHUB_REPO} [${GIT_BRANCH}]"
  else
    log "❌ push failed — will retry"
  fi
  log "── done ──"
}

log "Daemon starting (interval=${GIT_SYNC_INTERVAL}s)"
for i in $(seq 1 40); do [[ -d "${WORKSPACE}/.git" ]] && break; sleep 3; done
[[ ! -d "${WORKSPACE}/.git" ]] && { log "❌ Workspace not ready after 120s"; exit 1; }
log "Workspace ready"

sleep 20
do_sync "boot" || true

while true; do
  sleep "${TICK}"
  ELAPSED=$(( ELAPSED + TICK ))
  if [[ -f "${TRIGGER}" ]]; then
    rm -f "${TRIGGER}"
    log "⚡ manual trigger"
    do_sync "manual" || true
    ELAPSED=0
    continue
  fi
  if (( ELAPSED >= GIT_SYNC_INTERVAL )); then
    do_sync "scheduled" || true
    ELAPSED=0
  fi
done
