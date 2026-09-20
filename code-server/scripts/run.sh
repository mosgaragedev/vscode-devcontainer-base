#!/usr/bin/env bash
# ============================================================
# mosgarage — Quick run (no Compose needed)
# ============================================================

set -euo pipefail

IMAGE="docker.io/mosgarage/mosgarage:latest"
CONTAINER="mosgarage"

CODE_SERVER_PASSWORD="${CODE_SERVER_PASSWORD:-mosgarage}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GIT_SYNC_INTERVAL="${GIT_SYNC_INTERVAL:-900}"
API_KEY="${API_KEY:-}"

# SSH key (optional — comment out if using GITHUB_TOKEN)
SSH_KEY_PATH="${SSH_KEY_PATH:-./ssh-keys/id_ed25519}"
SSH_MOUNT=""
if [[ -f "${SSH_KEY_PATH}" ]]; then
  SSH_MOUNT="-v $(realpath "${SSH_KEY_PATH}"):/home/mosgarage/.ssh/id_ed25519:ro"
  echo "🔑  SSH key found at ${SSH_KEY_PATH} — mounting"
fi

echo ""
echo "🚀  Starting mosgarage..."
docker rm -f "${CONTAINER}" 2>/dev/null && echo "♻️   Removed existing container" || true

docker run -d \
  --name "${CONTAINER}" \
  --restart unless-stopped \
  -p 8080:8080 \
  -p 3000:3000 \
  -p 4000:4000 \
  -e CODE_SERVER_PASSWORD="${CODE_SERVER_PASSWORD}" \
  -e GITHUB_USER="mosgaragedev" \
  -e GITHUB_ORG="mosgarage" \
  -e GITHUB_REPO="mosgaragedev" \
  -e GITHUB_TOKEN="${GITHUB_TOKEN}" \
  -e GIT_BRANCH="main" \
  -e GIT_NAME="mosgaragedev" \
  -e GIT_EMAIL="mosgaragedev@users.noreply.github.com" \
  -e GIT_SYNC_INTERVAL="${GIT_SYNC_INTERVAL}" \
  -e API_KEY="${API_KEY}" \
  -e NODE_ENV=production \
  -v mosgarage-workspace:/app/workspace \
  -v mosgarage-code-server:/home/mosgarage/.code-server \
  -v mosgarage-logs:/var/log/mosgarage \
  ${SSH_MOUNT} \
  --memory 2g \
  --cpus 2 \
  "${IMAGE}"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  mosgarage is running! 🎉                        ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  code-server  →  http://localhost:8080           ║"
echo "║  node-server  →  http://localhost:3000           ║"
echo "║  api-server   →  http://localhost:4000           ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  GitHub  →  github.com/mosgarage/mosgaragedev    ║"
echo "║  Sync    →  every ${GIT_SYNC_INTERVAL}s                         "
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Logs:         docker logs -f ${CONTAINER}"
echo "  Shell:        docker exec -it ${CONTAINER} bash"
echo "  Git status:   docker exec ${CONTAINER} git-status"
echo "  Push now:     docker exec ${CONTAINER} git-push-now"
echo "  Stop:         docker stop ${CONTAINER}"
echo ""
