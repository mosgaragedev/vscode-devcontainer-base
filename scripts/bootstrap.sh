#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  mosgarage bootstrap — auto pull + setup, runs ONCE              ║
# ║                                                                  ║
# ║  curl -fsSL https://raw.githubusercontent.com/mosgaragedev/      ║
# ║        vscode-devcontainer-base/main/scripts/bootstrap.sh | bash ║
# ║                                                                  ║
# ║  Or after cloning:  ./scripts/bootstrap.sh [project-dir]         ║
# ║  Idempotent: safe to re-run; finished steps are skipped.         ║
# ╚══════════════════════════════════════════════════════════════════╝
set -euo pipefail

REPO_URL="${MOSGARAGE_REPO:-https://github.com/mosgaragedev/vscode-devcontainer-base.git}"
BRANCH="${MOSGARAGE_BRANCH:-main}"
IMAGE="${MOSGARAGE_IMAGE:-mosgarage/vscode-devcontainer-base:latest}"
PROJECT_DIR="${1:-${MOSGARAGE_PROJECT_DIR:-$HOME/mosgarage-workspace}}"
INSTALL_DIR="${MOSGARAGE_INSTALL_DIR:-$HOME/.mosgarage/vscode-devcontainer-base}"

log()  { echo "▸ $*"; }
ok()   { echo "✓ $*"; }
err()  { echo "✗ $*" >&2; exit 1; }

# ── 1. Host prerequisites ─────────────────────────────────────────────────────
command -v git >/dev/null || err "git is required — install it first (e.g. sudo apt install git)"
if ! command -v docker >/dev/null; then
    echo "⚠ docker not found. Install Docker Engine or Docker Desktop, then re-run."
    echo "  https://docs.docker.com/engine/install/"
fi

# ── 2. Auto-pull the repo (once) ──────────────────────────────────────────────
if [[ -d "${INSTALL_DIR}/.git" ]]; then
    log "Repo already present at ${INSTALL_DIR} — pulling latest..."
    git -C "${INSTALL_DIR}" pull --ff-only 2>/dev/null || log "(offline or detached — keeping local copy)"
else
    log "Cloning ${REPO_URL} (branch: ${BRANCH})..."
    git clone --depth 1 --branch "${BRANCH}" "${REPO_URL}" "${INSTALL_DIR}"
fi
ok "Repo ready at ${INSTALL_DIR}"

# ── 3. Install the `mg` host CLI ──────────────────────────────────────────────
BIN_DIR="${HOME}/.local/bin"
mkdir -p "${BIN_DIR}"
if [[ -f "${INSTALL_DIR}/scripts/mg" ]]; then
    install -m 0755 "${INSTALL_DIR}/scripts/mg" "${BIN_DIR}/mg"
    ok "Installed mg CLI → ${BIN_DIR}/mg"
fi
case ":${PATH}:" in
    *":${BIN_DIR}:"*) ;;
    *) log "Note: add '${BIN_DIR}' to your PATH (most shells already include it)" ;;
esac

# ── 4. Pull the image ─────────────────────────────────────────────────────────
if command -v docker >/dev/null; then
    if docker image inspect "${IMAGE}" >/dev/null 2>&1; then
        log "Image ${IMAGE} already present (use 'mg update' to refresh)"
    else
        log "Pulling ${IMAGE}..."
        docker pull "${IMAGE}" || log "Pull failed — the image will be built locally on first use"
    fi
fi

# ── 5. Seed a devcontainer project (once) ─────────────────────────────────────
if [[ ! -e "${PROJECT_DIR}/.devcontainer/devcontainer.json" ]]; then
    log "Creating devcontainer project at ${PROJECT_DIR}..."
    mkdir -p "${PROJECT_DIR}/.devcontainer"
    if [[ -f "${INSTALL_DIR}/.devcontainer/devcontainer.json" ]]; then
        cp "${INSTALL_DIR}/.devcontainer/devcontainer.json" "${PROJECT_DIR}/.devcontainer/devcontainer.json"
    fi
    ok "Wrote ${PROJECT_DIR}/.devcontainer/devcontainer.json"
else
    log "Devcontainer config already exists at ${PROJECT_DIR} — leaving it untouched"
fi

cat <<EOF

✓ Bootstrap complete!

  Next steps:
    cd ${PROJECT_DIR}
    mg start          # launch the container (see: mg help)

  Docs: https://github.com/mosgaragedev/vscode-devcontainer-base#readme

EOF
