#!/usr/bin/env bash
# ============================================================
# mosgarage startup script
# Runs inside container — patches config then launches supervisor
# ============================================================

set -euo pipefail

CODE_SERVER_PASSWORD="${CODE_SERVER_PASSWORD:-mosgarage}"
CODE_SERVER_PORT="${CODE_SERVER_PORT:-8080}"
NODE_SERVER_PORT="${NODE_SERVER_PORT:-3000}"
API_PORT="${API_PORT:-4000}"

echo "
╔══════════════════════════════════════════════════╗
║              mosgarage · home base               ║
╠══════════════════════════════════════════════════╣
║  code-server  → :${CODE_SERVER_PORT}             
║  node-server  → :${NODE_SERVER_PORT}             
║  api-server   → :${API_PORT}                     
╚══════════════════════════════════════════════════╝
"

# ── Patch code-server config with real password ──────────────
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

# ── Ensure log dir exists ─────────────────────────────────────
mkdir -p /var/log/mosgarage

# ── Fix ownership ─────────────────────────────────────────────
chown -R mosgarage:mosgarage /home/mosgarage /app /var/log/mosgarage 2>/dev/null || true

# ── Install recommended VS Code extensions (non-blocking) ────
(
  sleep 8
  su - mosgarage -c "code-server \
    --install-extension ms-python.python \
    --install-extension dbaeumer.vscode-eslint \
    --install-extension esbenp.prettier-vscode \
    --install-extension ms-azuretools.vscode-docker \
    --install-extension eamodio.gitlens \
    --install-extension PKief.material-icon-theme \
    2>/dev/null || true"
  echo "[startup] VS Code extensions installed"
) &

echo "[startup] Launching supervisor..."
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
