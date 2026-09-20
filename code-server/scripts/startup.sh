#!/usr/bin/env bash
# ============================================================
# mosgarage startup script
# ============================================================

set -euo pipefail

CODE_SERVER_PASSWORD="${CODE_SERVER_PASSWORD:-mosgarage}"
CODE_SERVER_PORT="${CODE_SERVER_PORT:-8080}"
NODE_SERVER_PORT="${NODE_SERVER_PORT:-3000}"
API_PORT="${API_PORT:-4000}"
GITHUB_ORG="${GITHUB_ORG:-mosgarage}"
GITHUB_REPO="${GITHUB_REPO:-mosgaragedev}"
GITHUB_USER="${GITHUB_USER:-mosgaragedev}"
GIT_BRANCH="${GIT_BRANCH:-main}"

echo "
╔══════════════════════════════════════════════════════╗
║              mosgarage · home base                   ║
╠══════════════════════════════════════════════════════╣
║  code-server  → :${CODE_SERVER_PORT}                 
║  node-server  → :${NODE_SERVER_PORT}                 
║  api-server   → :${API_PORT}                         
║  git sync     → github.com/${GITHUB_ORG}/${GITHUB_REPO} [${GIT_BRANCH}]
╚══════════════════════════════════════════════════════╝
"

# ── SSH dir permissions (if key was mounted) ──────────────────
SSH_DIR="/home/mosgarage/.ssh"
mkdir -p "${SSH_DIR}"
if [[ -f "${SSH_DIR}/id_ed25519" ]]; then
  chmod 600 "${SSH_DIR}/id_ed25519"
  [[ -f "${SSH_DIR}/id_ed25519.pub" ]] && chmod 644 "${SSH_DIR}/id_ed25519.pub"
  chown -R mosgarage:mosgarage "${SSH_DIR}"
  echo "[startup] SSH key detected — using SSH auth for GitHub"
elif [[ -n "${GITHUB_TOKEN:-}" ]]; then
  echo "[startup] GITHUB_TOKEN set — using HTTPS auth for GitHub"
else
  echo "[startup] ⚠️  No GitHub auth configured. Set GITHUB_TOKEN or mount SSH key."
  echo "           Git sync will run in read-only / local-only mode."
fi

# ── Patch code-server config ──────────────────────────────────
CONFIG_FILE="/home/mosgarage/.config/code-server/config.yaml"
mkdir -p "$(dirname "$CONFIG_FILE")"
cat > "$CONFIG_FILE" <<EOF
bind-addr: 0.0.0.0:${CODE_SERVER_PORT}
auth: password
password: ${CODE_SERVER_PASSWORD}
cert: false
user-data-dir: /home/mosgarage/.code-server
extensions-dir: /home/mosgarage/.code-server/extensions
EOF

# ── Ensure dirs & permissions ─────────────────────────────────
mkdir -p /var/log/mosgarage /app/workspace
chown -R mosgarage:mosgarage /home/mosgarage /app /var/log/mosgarage 2>/dev/null || true

# ── Install VS Code extensions (background, non-blocking) ─────
(
  sleep 12
  su - mosgarage -c "code-server \
    --install-extension ms-python.python \
    --install-extension dbaeumer.vscode-eslint \
    --install-extension esbenp.prettier-vscode \
    --install-extension ms-azuretools.vscode-docker \
    --install-extension eamodio.gitlens \
    --install-extension PKief.material-icon-theme \
    --install-extension GitHub.vscode-pull-request-github \
    2>/dev/null || true"
  echo "[startup] VS Code extensions installed"
) &

echo "[startup] Launching supervisor (git-setup → git-sync → services)..."
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
