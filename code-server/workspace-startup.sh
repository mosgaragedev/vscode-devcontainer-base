#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  mosgarage/code-server · workspace-startup.sh                    ║
# ║  Entrypoint for Docker container and WSL2 distro boot            ║
# ╚══════════════════════════════════════════════════════════════════╝
set -euo pipefail

LOG=/var/log/mosgarage/startup.log
mkdir -p /var/log/mosgarage
exec > >(tee -a "$LOG") 2>&1

log()  { echo "[mosgarage] $*"; }
warn() { echo "[mosgarage] WARN: $*" >&2; }
ok()   { echo "[mosgarage] ✓ $*"; }

log "Starting mosgarage workspace..."
log "Variant: ${MOSGARAGE_VARIANT:-base}"

# ── code-server password ───────────────────────────────────────────────────────
CONFIG=/home/mosgarage/.config/code-server/config.yaml

if [[ -n "${CS_DISABLE_AUTH:-}" ]]; then
  log "Auth disabled (CS_DISABLE_AUTH set)"
  sed -i 's/^auth:.*/auth: none/' "$CONFIG"
elif [[ -n "${CODE_SERVER_PASSWORD:-}" ]]; then
  log "Setting code-server password from CODE_SERVER_PASSWORD"
  if grep -q "^password:" "$CONFIG"; then
    sed -i "s|^password:.*|password: ${CODE_SERVER_PASSWORD}|" "$CONFIG"
  else
    echo "password: ${CODE_SERVER_PASSWORD}" >> "$CONFIG"
  fi
else
  warn "CODE_SERVER_PASSWORD not set — a random token will be logged"
fi

# ── SSH authorised keys ────────────────────────────────────────────────────────
SSH_DIR=/home/mosgarage/.ssh
mkdir -p "$SSH_DIR" && chmod 700 "$SSH_DIR"
chown mosgarage:mosgarage "$SSH_DIR"

if [[ -n "${SSH_AUTHORIZED_KEYS:-}" ]]; then
  log "Injecting SSH_AUTHORIZED_KEYS"
  echo "${SSH_AUTHORIZED_KEYS}" >> "$SSH_DIR/authorized_keys"
fi

# Pull GitHub keys — reuses GITHUB_USER from control plane env
if [[ -n "${GITHUB_USER:-}" ]]; then
  log "Fetching SSH keys for GitHub user: ${GITHUB_USER}"
  curl -fsSL "https://github.com/${GITHUB_USER}.keys" \
    >> "$SSH_DIR/authorized_keys" 2>/dev/null \
    || warn "Could not fetch GitHub keys for ${GITHUB_USER}"
fi

if [[ -f "$SSH_DIR/authorized_keys" ]]; then
  chmod 600 "$SSH_DIR/authorized_keys"
  chown mosgarage:mosgarage "$SSH_DIR/authorized_keys"
fi

# ── Git config ────────────────────────────────────────────────────────────────
if [[ -n "${GIT_NAME:-}" ]]; then
  su -c "git config --global user.name '${GIT_NAME}'" mosgarage || true
fi
if [[ -n "${GIT_EMAIL:-}" ]]; then
  su -c "git config --global user.email '${GIT_EMAIL}'" mosgarage || true
fi

# ── Workspace ownership ────────────────────────────────────────────────────────
chown -R mosgarage:mosgarage /home/mosgarage/workspace 2>/dev/null || true
chown -R mosgarage:mosgarage /home/mosgarage/.config    2>/dev/null || true

# ── Summary ───────────────────────────────────────────────────────────────────
ok "code-server   → http://0.0.0.0:8080"
ok "SSH           → port 2222"
ok "Agent         → port 7072 (if binary present)"
ok "Workspace     → /home/mosgarage/workspace"

# ── Hand off to supervisor ─────────────────────────────────────────────────────
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/workspace.conf
