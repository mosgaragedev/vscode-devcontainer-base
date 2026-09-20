#!/usr/bin/env bash
# docker-prune.sh
# Called daily by the docker-prune systemd timer.
# Removes all stopped containers, unused networks, dangling images,
# unused build cache, and unused volumes.
#
# Log: /var/log/docker-prune.log

set -euo pipefail

LOG="/var/log/docker-prune.log"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

log() { echo "[$TIMESTAMP] $*" | tee -a "$LOG"; }

log "━━━ Docker prune started ━━━"

# Bail out if Docker isn't running
if ! systemctl is-active --quiet docker; then
    log "Docker is not running — skipping prune."
    exit 0
fi

# ── Containers ────────────────────────────────────────────────────────────────
CONTAINERS=$(docker ps -aq --filter status=exited --filter status=dead 2>/dev/null | wc -l)
log "Stopped containers found: $CONTAINERS"

# ── Full system prune ─────────────────────────────────────────────────────────
# -a  = remove ALL unused images (not just dangling)
# -f  = no confirmation prompt
# --volumes = also remove unused named volumes
OUTPUT=$(docker system prune -af --volumes 2>&1)
log "$OUTPUT"

# ── Build cache ───────────────────────────────────────────────────────────────
CACHE=$(docker buildx prune -af 2>&1)
log "BuildKit cache: $CACHE"

log "━━━ Prune complete ━━━"
