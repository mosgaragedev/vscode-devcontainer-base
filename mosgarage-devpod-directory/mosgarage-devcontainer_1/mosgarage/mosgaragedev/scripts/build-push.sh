#!/usr/bin/env bash
# ============================================================
# mosgarage — Build & Push to docker.io
# Usage:  ./scripts/build-push.sh [version]
#         ./scripts/build-push.sh 1.0.0
# ============================================================

set -euo pipefail

REGISTRY="docker.io"
NAMESPACE="mosgarage"
IMAGE="mosgarage"
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE}"
VERSION="${1:-latest}"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  mosgarage · build & push                        ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Image   : ${FULL_IMAGE}"
echo "║  Tags    : ${VERSION}  latest"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Check docker is available ─────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "❌  Docker not found. Install it from https://docs.docker.com/get-docker/"
  exit 1
fi

# ── Check docker login ────────────────────────────────────────
echo "🔐  Checking Docker Hub login..."
if ! docker info 2>/dev/null | grep -q "Username"; then
  echo "⚠️   Not logged in. Running docker login..."
  docker login
fi

# ── Build ─────────────────────────────────────────────────────
echo ""
echo "🔨  Building image..."
docker build \
  --platform linux/amd64 \
  --tag "${FULL_IMAGE}:${VERSION}" \
  --tag "${FULL_IMAGE}:latest" \
  --label "build.version=${VERSION}" \
  --label "build.date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --label "build.commit=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
  .

echo ""
echo "✅  Build complete: ${FULL_IMAGE}:${VERSION}"

# ── Push ──────────────────────────────────────────────────────
echo ""
echo "🚀  Pushing to Docker Hub..."
docker push "${FULL_IMAGE}:${VERSION}"
docker push "${FULL_IMAGE}:latest"

echo ""
echo "✅  Push complete!"
echo ""
echo "  Pull command:"
echo "  docker pull ${FULL_IMAGE}:${VERSION}"
echo ""
echo "  Quick run:"
echo "  docker run -d \\"
echo "    -p 8080:8080 -p 3000:3000 -p 4000:4000 \\"
echo "    -e CODE_SERVER_PASSWORD=yourpassword \\"
echo "    --name mosgarage \\"
echo "    ${FULL_IMAGE}:${VERSION}"
echo ""
