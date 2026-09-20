#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  backup-workspace.sh — automatic container config backups        ║
# ║                                                                  ║
# ║  Invoked by /etc/cron.d/mosgarage-backup and by `mgw backup`.    ║
# ║  Backs up shell + credentials + optional extra sources with a    ║
# ║  timestamp, then rotates old archives.                           ║
# ╚══════════════════════════════════════════════════════════════════╝
set -euo pipefail

USERNAME="$(id -un 2>/dev/null || echo mosgarage)"
USER_HOME="$(getent passwd "${USERNAME}" | cut -d: -f6)"
USER_HOME="${USER_HOME:-/home/mosgarage}"

# Where archives go. /workspaces is the persistent mount in devcontainers;
# fall back to the user home when running standalone.
BACKUP_DIR="${BACKUP_DIR:-/workspaces/.mosgarage-backups}"
if ! mkdir -p "${BACKUP_DIR}" 2>/dev/null; then
    BACKUP_DIR="${USER_HOME}/backups/mosgarage"
    mkdir -p "${BACKUP_DIR}"
fi

# Extra sources can be added with BACKUP_EXTRA_SOURCES="path1 path2"
DEFAULT_SOURCES=".kube .config/helm .ssh .zshrc .zsh-aliases.zsh .p10k.zsh .bindkeys.zsh .gitconfig .gitconfig.mosgarage"
SOURCES="${DEFAULT_SOURCES} ${BACKUP_EXTRA_SOURCES:-}"

KEEP="${BACKUP_KEEP:-7}"
STAMP="$(date +%Y%m%d-%H%M%S)"
HOSTNAME_TAG="$(hostname -s)"
ARCHIVE="${BACKUP_DIR}/mosgarage-backup-${HOSTNAME_TAG}-${STAMP}.tar.gz"
LOG_TAG="backup-workspace"

log()  { echo "[$(date '+%F %T')] [${LOG_TAG}] $*"; }

# Only archive sources that actually exist.
EXISTING=()
for SRC in ${SOURCES}; do
    [[ -e "${USER_HOME}/${SRC}" ]] && EXISTING+=("${SRC}")
done

if [[ ${#EXISTING[@]} -eq 0 ]]; then
    log "Nothing to back up in ${USER_HOME} — skipping."
    exit 0
fi

log "Backing up ${#EXISTING[@]} source(s) from ${USER_HOME} → ${ARCHIVE}"
tar -czf "${ARCHIVE}" -C "${USER_HOME}" "${EXISTING[@]}"
chmod 600 "${ARCHIVE}" 2>/dev/null || true

# Rotate old archives (newest KEEP archives are kept).
ls -1t "${BACKUP_DIR}"/mosgarage-backup-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r OLD; do
    log "Rotating out ${OLD}"
    rm -f "${OLD}"
done

log "✓ Backup complete: ${ARCHIVE} ($(du -sh "${ARCHIVE}" | cut -f1))"
