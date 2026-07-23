#!/usr/bin/env bash
# =============================================================================
# setup-wsl-docker.sh
# Configure WSL to use Docker CLI WITHOUT Docker Desktop.
# Run this ONCE in your WSL terminal before opening the devcontainer.
#
# Usage: bash setup-wsl-docker.sh
# =============================================================================
set -euo pipefail

info()    { echo -e "\033[1;36m[setup]\033[0m $*"; }
success() { echo -e "\033[1;32m[ ok ]\033[0m $*"; }
warn()    { echo -e "\033[1;33m[warn]\033[0m $*"; }
die()     { echo -e "\033[1;31m[fail]\033[0m $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Remove Docker Desktop's config interference
#    This is the line that was breaking your WSL — Desktop writes a
#    Windows-incompatible credsStore into ~/.docker/config.json
# ---------------------------------------------------------------------------
DOCKER_CONFIG="${HOME}/.docker/config.json"

if [[ -f "${DOCKER_CONFIG}" ]]; then
    info "Cleaning Docker Desktop credsStore from config.json..."
    # Remove credsStore key if it points to desktop-linux or wincred
    if command -v python3 &>/dev/null; then
        python3 -c "
import json, sys
with open('${DOCKER_CONFIG}') as f:
    cfg = json.load(f)
removed = []
for key in ['credsStore', 'credStore', 'credHelpers']:
    if key in cfg:
        removed.append(key)
        del cfg[key]
with open('${DOCKER_CONFIG}', 'w') as f:
    json.dump(cfg, f, indent=2)
print('Removed:', removed if removed else 'nothing to remove')
"
    else
        warn "python3 not found — manually remove 'credsStore' from ${DOCKER_CONFIG}"
    fi
    success "Docker config cleaned"
fi

# ---------------------------------------------------------------------------
# 2. Install Docker Engine (CLI + daemon) natively in WSL
# ---------------------------------------------------------------------------
if ! command -v docker &>/dev/null; then
    info "Installing Docker Engine in WSL..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
      | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y -qq \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
    success "Docker Engine installed"
else
    info "Docker already installed — checking version"
    docker --version
fi

# ---------------------------------------------------------------------------
# 3. Start Docker daemon in WSL (no systemd in older WSL — use service)
# ---------------------------------------------------------------------------
info "Starting Docker daemon..."
if command -v systemctl &>/dev/null && systemctl is-system-running &>/dev/null; then
    # WSL2 with systemd enabled (Ubuntu 22.04+ with [boot] systemd=true)
    sudo systemctl enable docker
    sudo systemctl start docker
    success "Docker started via systemd"
else
    # WSL without systemd — start daemon directly
    if ! pgrep dockerd >/dev/null; then
        sudo dockerd > /tmp/dockerd.log 2>&1 &
        sleep 3
        success "Docker daemon started (background)"
        warn "To start automatically: add 'sudo dockerd &' to your ~/.bashrc"
        warn "Or enable systemd in WSL: echo '[boot]\nsystemd=true' | sudo tee -a /etc/wsl.conf"
    else
        info "Docker daemon already running"
    fi
fi

# ---------------------------------------------------------------------------
# 4. Add current user to docker group (no sudo needed for docker commands)
# ---------------------------------------------------------------------------
if ! groups | grep -q docker; then
    info "Adding ${USER} to docker group..."
    sudo usermod -aG docker "${USER}"
    warn "Group change requires new shell — run: newgrp docker"
fi

# ---------------------------------------------------------------------------
# 5. Install devcontainer CLI
# ---------------------------------------------------------------------------
if ! command -v devcontainer &>/dev/null; then
    info "Installing @devcontainers/cli..."
    sudo npm install -g @devcontainers/cli 2>/dev/null || \
        npm install -g @devcontainers/cli
    success "devcontainer CLI installed"
else
    info "devcontainer CLI already installed: $(devcontainer --version)"
fi

# ---------------------------------------------------------------------------
# 6. Verify
# ---------------------------------------------------------------------------
echo ""
info "Verification..."
docker version --format "  Docker:          {{.Server.Version}}" 2>/dev/null || warn "Docker daemon not responding"
docker compose version --short 2>/dev/null | xargs -I{} echo "  Docker Compose:  {}"
node --version | xargs -I{} echo "  Node.js:         {}"
devcontainer --version 2>/dev/null | xargs -I{} echo "  devcontainer:    {}" || true

echo ""
success "WSL Docker setup complete — no Docker Desktop needed!"
echo ""
echo "  Next steps:"
echo "  1. Run: newgrp docker   (or open a new terminal)"
echo "  2. cd into your project root"
echo "  3. code .               (VS Code → 'Reopen in Container')"
echo "     OR: devcontainer open ."
echo ""
echo "  To enable systemd (recommended for auto-start):"
echo "    echo -e '[boot]\nsystemd=true' | sudo tee -a /etc/wsl.conf"
echo "    wsl --shutdown   (from PowerShell, then reopen WSL)"
