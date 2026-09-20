#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  wsl-pack.sh — Export mosgarage/code-server as WSL2 rootfs       ║
# ║                                                                  ║
# ║  Usage: ./scripts/wsl-pack.sh [variant]                          ║
# ║    variant: base | sdk | python | full   (default: base)         ║
# ╚══════════════════════════════════════════════════════════════════╝
set -euo pipefail

VARIANT="${1:-base}"
IMAGE="mosgarage/code-server:${VARIANT}"
OUTDIR="./dist"
OUTFILE="${OUTDIR}/mosgarage-cs-${VARIANT}.tar.gz"

log()  { echo "▸ $*"; }
ok()   { echo "✓ $*"; }
err()  { echo "✗ $*" >&2; exit 1; }

case "$VARIANT" in
  base|sdk|python|full|latest) ;;
  *) err "Unknown variant '${VARIANT}'. Choose: base sdk python full" ;;
esac

log "Packing ${IMAGE} → ${OUTFILE}"

# Build if not present locally
if ! docker image inspect "${IMAGE}" &>/dev/null; then
  log "Image not found locally — building target '${VARIANT}'..."
  docker build --target "${VARIANT}" -t "${IMAGE}" .
fi

mkdir -p "${OUTDIR}"

log "Creating temporary container..."
CID=$(docker create "${IMAGE}" /bin/true)

log "Exporting rootfs (this takes a moment)..."
docker export "${CID}" | gzip -9 > "${OUTFILE}"

log "Removing temporary container..."
docker rm "${CID}" > /dev/null

SIZE=$(du -sh "${OUTFILE}" | cut -f1)
ok "Packed: ${OUTFILE} (${SIZE})"
echo ""
echo "  Import on Windows:"
echo "    .\\scripts\\wsl-import.ps1 -Variant ${VARIANT}"
echo ""
echo "  Or manually:"
echo "    \$name = \"MosgarageCS-${VARIANT}\""
echo "    \$dir  = \"\$env:USERPROFILE\\WSL\\MosgarageCS-${VARIANT}\""
echo "    wsl --import \$name \$dir .\\dist\\mosgarage-cs-${VARIANT}.tar.gz --version 2"
