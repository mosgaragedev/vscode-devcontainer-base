#!/usr/bin/env bash
# ============================================================
# mosgarage — Quick run (no Compose needed)
# ============================================================

set -euo pipefail

IMAGE="docker.io/mosgarage/mosgarage:latest"
CONTAINER="mosgarage"

CODE_SERVER_PASSWORD="${CODE_SERVER_PASSWORD:-mosgarage}"
API_KEY="${API_KEY:-}"

echo ""
echo "🚀  Starting mosgarage container..."
echo ""

# Stop/remove existing
docker rm -f "${CONTAINER}" 2>/dev/null && echo "♻️   Removed existing container" || true

docker run -d \
  --name "${CONTAINER}" \
  --restart unless-stopped \
  -p 8080:8080 \
  -p 3000:3000 \
  -p 4000:4000 \
  -e CODE_SERVER_PASSWORD="${CODE_SERVER_PASSWORD}" \
  -e API_KEY="${API_KEY}" \
  -e NODE_ENV=production \
  -v mosgarage-workspace:/app/workspace \
  -v mosgarage-code-server:/home/mosgarage/.code-server \
  -v mosgarage-logs:/var/log/mosgarage \
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
echo "║  Password: ${CODE_SERVER_PASSWORD}               "
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Logs:     docker logs -f ${CONTAINER}"
echo "  Shell:    docker exec -it ${CONTAINER} bash"
echo "  Stop:     docker stop ${CONTAINER}"
echo ""
