#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  workspace-startup.sh — entrypoint for the :code-server target   ║
# ║  Starts code-server, sshd, cron backups via supervisord.         ║
# ╚══════════════════════════════════════════════════════════════════╝
set -euo pipefail

USERNAME=mosgarage
USER_HOME=/home/${USERNAME}
LOG_DIR=/var/log/mosgarage
CONFIG=${USER_HOME}/.config/code-server/config.yaml

mkdir -p "${LOG_DIR}"
exec > >(tee -a "${LOG_DIR}/startup.log") 2>&1

log()  { echo "[mosgarage] $*"; }
warn() { echo "[mosgarage] WARN: $*" >&2; }
ok()   { echo "[mosgarage] ✓ $*"; }

log "Starting mosgarage workspace (vscode-devcontainer-base:code-server)..."

# ── code-server password ──────────────────────────────────────────────────────
if [[ -n "${CS_DISABLE_AUTH:-}" ]]; then
    log "Auth disabled (CS_DISABLE_AUTH set)"
    sed -i 's/^auth:.*/auth: none/' "${CONFIG}"
elif [[ -n "${CODE_SERVER_PASSWORD:-}" ]]; then
    log "Setting code-server password from CODE_SERVER_PASSWORD"
    if grep -q "^password:" "${CONFIG}"; then
        sed -i "s|^password:.*|password: ${CODE_SERVER_PASSWORD}|" "${CONFIG}"
    else
        echo "password: ${CODE_SERVER_PASSWORD}" >> "${CONFIG}"
    fi
else
    warn "CODE_SERVER_PASSWORD not set — code-server will print a token in its log"
fi
chown ${USERNAME}:${USERNAME} "${CONFIG}" 2>/dev/null || true

# ── SSH authorised keys ───────────────────────────────────────────────────────
SSH_DIR=${USER_HOME}/.ssh
mkdir -p "${SSH_DIR}" && chmod 700 "${SSH_DIR}"
chown ${USERNAME}:${USERNAME} "${SSH_DIR}"

if [[ -n "${SSH_AUTHORIZED_KEYS:-}" ]]; then
    log "Injecting SSH_AUTHORIZED_KEYS"
    echo "${SSH_AUTHORIZED_KEYS}" >> "${SSH_DIR}/authorized_keys"
fi

if [[ -n "${GITHUB_USER:-}" ]]; then
    log "Fetching SSH keys for GitHub user: ${GITHUB_USER}"
    curl -fsSL "https://github.com/${GITHUB_USER}.keys" >> "${SSH_DIR}/authorized_keys" 2>/dev/null \
        || warn "Could not fetch GitHub keys for ${GITHUB_USER}"
fi

if [[ -f "${SSH_DIR}/authorized_keys" ]]; then
    chmod 600 "${SSH_DIR}/authorized_keys"
    chown ${USERNAME}:${USERNAME} "${SSH_DIR}/authorized_keys"
fi

# ── Git identity ──────────────────────────────────────────────────────────────
if [[ -n "${GIT_NAME:-}" ]]; then
    sudo -u ${USERNAME} git config --global user.name "${GIT_NAME}" || true
fi
if [[ -n "${GIT_EMAIL:-}" ]]; then
    sudo -u ${USERNAME} git config --global user.email "${GIT_EMAIL}" || true
fi

# ── Ownership + first backup ─────────────────────────────────────────────────
chown -R ${USERNAME}:${USERNAME} "${USER_HOME}/workspace" "${USER_HOME}/.config" 2>/dev/null || true
if [[ ! -d /workspaces/.mosgarage-backups ]] || [[ -z "$(ls -A /workspaces/.mosgarage-backups 2>/dev/null)" ]]; then
    sudo -u ${USERNAME} /usr/local/bin/backup-workspace || true
fi

# ── Summary ───────────────────────────────────────────────────────────────────
ok "code-server   → http://0.0.0.0:8080"
ok "SSH           → port 2222"
ok "Backups       → cron (nightly 02:00) + 'mgw backup'"
ok "Workspace     → ${USER_HOME}/workspace"

# ── Hand off to supervisor ────────────────────────────────────────────────────
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/workspace.conf
