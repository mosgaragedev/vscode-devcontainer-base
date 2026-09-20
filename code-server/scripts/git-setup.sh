#!/usr/bin/env bash
set -uo pipefail
GITHUB_USER="${GITHUB_USER:-mosgaragedev}"
GITHUB_REPO="${GITHUB_REPO:-mosgaragedev}"
GITHUB_ORG="${GITHUB_ORG:-mosgarage}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GIT_EMAIL="${GIT_EMAIL:-mosgaragedev@users.noreply.github.com}"
GIT_NAME="${GIT_NAME:-mosgaragedev}"
GIT_BRANCH="${GIT_BRANCH:-main}"
WORKSPACE="/app/workspace"
SSH_KEY="/home/mosgarage/.ssh/id_ed25519"
LOG="/var/log/mosgarage/git-sync.log"

log() { echo "[git-setup] $(date '+%Y-%m-%d %H:%M:%S') $*" | tee -a "$LOG"; }

if [[ -f "${SSH_KEY}" ]]; then
  REMOTE="git@github.com:${GITHUB_ORG}/${GITHUB_REPO}.git"
  log "Auth: SSH key"
  cat > /home/mosgarage/.ssh/config <<EOF
Host github.com
  HostName github.com
  User git
  IdentityFile ${SSH_KEY}
  StrictHostKeyChecking no
  ServerAliveInterval 60
EOF
  chmod 600 /home/mosgarage/.ssh/config
elif [[ -n "${GITHUB_TOKEN}" ]]; then
  REMOTE="https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_ORG}/${GITHUB_REPO}.git"
  log "Auth: HTTPS token"
  # Store credentials
  echo "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com" > /home/mosgarage/.git-credentials
  chmod 600 /home/mosgarage/.git-credentials
else
  log "⚠️  No auth configured (GITHUB_TOKEN or SSH key). Sync will be read-only."
  REMOTE="https://github.com/${GITHUB_ORG}/${GITHUB_REPO}.git"
fi

git config --global user.name  "${GIT_NAME}"
git config --global user.email "${GIT_EMAIL}"
git config --global init.defaultBranch "${GIT_BRANCH}"
git config --global pull.rebase false
git config --global credential.helper store

if [[ -d "${WORKSPACE}/.git" ]]; then
  log "Repo exists — pulling latest..."
  cd "${WORKSPACE}"
  git remote set-url origin "${REMOTE}" 2>/dev/null || true
  git stash 2>/dev/null || true
  git fetch origin "${GIT_BRANCH}" 2>&1 | tee -a "$LOG" || true
  git merge "origin/${GIT_BRANCH}" --no-edit 2>&1 | tee -a "$LOG" || true
  git stash pop 2>/dev/null || true
else
  log "Cloning ${GITHUB_ORG}/${GITHUB_REPO}..."
  mkdir -p "${WORKSPACE}"
  # Try clone; if repo empty or branch missing, init fresh
  git clone --branch "${GIT_BRANCH}" --single-branch "${REMOTE}" "${WORKSPACE}" 2>&1 | tee -a "$LOG" || {
    log "Clone failed or branch missing — initialising fresh repo..."
    cd "${WORKSPACE}"
    git init
    git remote add origin "${REMOTE}" 2>/dev/null || true
    # Add existing workspace files as initial commit
    [[ -f "WELCOME.md" ]] && git add -A && git commit -m "chore: initial commit [mosgarage auto-setup]" 2>/dev/null || true
    git push -u origin "${GIT_BRANCH}" 2>&1 | tee -a "$LOG" || true
  }
fi

# Ensure .gitignore
cd "${WORKSPACE}"
if [[ ! -f ".gitignore" ]]; then
  cat > .gitignore <<'GITIGNORE'
node_modules/
.env
.env.local
*.log
.DS_Store
Thumbs.db
.cache/
dist/
build/
*.tmp
*.swp
__pycache__/
*.pyc
GITIGNORE
  git add .gitignore && git commit -m "chore: add .gitignore [auto]" 2>/dev/null || true
fi

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > /var/log/mosgarage/git-last-setup.txt
log "✅ git-setup complete"
