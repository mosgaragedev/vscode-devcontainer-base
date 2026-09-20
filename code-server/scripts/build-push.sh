#!/usr/bin/env bash
# ============================================================
# mosgarage — Build & Push to docker.io/mosgarage/mosgarage
# Usage:  ./scripts/build-push.sh [version]
# ============================================================

set -euo pipefail

REGISTRY="docker.io"
NAMESPACE="mosgarage"
IMAGE="mosgarage"
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE}"
VERSION="${1:-latest}"
GITHUB_REPO="https://github.com/mosgarage/mosgaragedev"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  mosgarage · build & push                        ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Docker : ${FULL_IMAGE}"
echo "║  GitHub : ${GITHUB_REPO}"
echo "║  Tags   : ${VERSION}  latest"
echo "╚══════════════════════════════════════════════════╝"
echo ""

command -v docker &>/dev/null || { echo "❌ Docker not found"; exit 1; }

echo "🔐  Checking Docker Hub login..."
if ! docker info 2>/dev/null | grep -q "Username"; then
  docker login
fi

echo ""
echo "🔨  Building image..."
docker build \
  --platform linux/amd64 \
  --tag "${FULL_IMAGE}:${VERSION}" \
  --tag "${FULL_IMAGE}:latest" \
  --label "build.version=${VERSION}" \
  --label "build.date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --label "build.commit=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
  --label "org.opencontainers.image.source=${GITHUB_REPO}" \
  .

echo ""
echo "✅  Build complete: ${FULL_IMAGE}:${VERSION}"
echo ""
echo "🚀  Pushing to Docker Hub..."
docker push "${FULL_IMAGE}:${VERSION}"
docker push "${FULL_IMAGE}:latest"

echo ""
echo "✅  Push complete!"
echo ""
echo "  Pull:  docker pull ${FULL_IMAGE}:${VERSION}"
echo ""
echo "  Run:"
echo "  docker run -d \\"
echo "    -p 8080:8080 -p 3000:3000 -p 4000:4000 \\"
echo "    -e CODE_SERVER_PASSWORD=yourpassword \\"
echo "    -e GITHUB_TOKEN=ghp_your_token \\"
echo "    -v mosgarage-workspace:/app/workspace \\"
echo "    --name mosgarage \\"
echo "    ${FULL_IMAGE}:${VERSION}"
echo ""
