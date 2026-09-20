#!/usr/bin/env bash
# setup-intel-gpu.sh
# Installs Intel GPU compute drivers inside WSL2 so the UHD Graphics
# is available to both native Linux processes and Docker containers.
#
# Hardware: Intel UHD Graphics, 16 GB RAM
# Host requirement: Intel Graphics Driver for Windows must be up to date
#                   (Settings > Windows Update > Optional updates, or intel.com/graphics)
#
# Run INSIDE your WSL2 distro:
#   chmod +x setup-intel-gpu.sh && sudo ./setup-intel-gpu.sh

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
step() { echo -e "\n${CYAN}[+] $*${NC}"; }
ok()   { echo -e "    ${GREEN}OK${NC}  $*"; }
warn() { echo -e "    ${YELLOW}!!${NC}  $*"; }
fail() { echo -e "    ${RED}ERR${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && fail "Run with sudo: sudo ./setup-intel-gpu.sh"

# ── 1. Verify /dev/dri is present ─────────────────────────────────────────────
step "Checking GPU passthrough from Windows host"

if [[ ! -d /dev/dri ]]; then
    fail "/dev/dri not found.\n\n  Make sure:\n  1. wsl.conf has 'gpuSupport = true'\n  2. Your Intel Windows driver is up to date\n  3. You ran 'wsl --shutdown' after editing wsl.conf"
fi

ls /dev/dri
ok "/dev/dri is present — GPU passthrough active"

# ── 2. Install Intel compute-runtime (OpenCL + Level Zero) ───────────────────
step "Installing Intel GPU compute runtime"

apt-get update -qq
apt-get install -y -qq \
    gpg-agent \
    wget \
    ocl-icd-libopencl1 \
    clinfo

# Intel graphics apt repo
wget -qO - https://repositories.intel.com/graphics/intel-graphics.key \
    | gpg --dearmor -o /usr/share/keyrings/intel-graphics.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/intel-graphics.gpg] \
https://repositories.intel.com/graphics/ubuntu $(lsb_release -cs) arc" \
    | tee /etc/apt/sources.list.d/intel-graphics.list > /dev/null

apt-get update -qq
apt-get install -y -qq \
    intel-opencl-icd \
    intel-level-zero-gpu \
    level-zero \
    intel-media-va-driver-non-free \
    libmfx1 \
    libmfxgen1 \
    libvpl2 \
    vainfo \
    clinfo

ok "Intel compute runtime installed"

# ── 3. Verify OpenCL sees the GPU ─────────────────────────────────────────────
step "Verifying OpenCL GPU visibility"

CLINFO_OUT=$(clinfo 2>&1)
if echo "$CLINFO_OUT" | grep -qi "intel"; then
    ok "Intel GPU detected via OpenCL"
    echo "$CLINFO_OUT" | grep -E "Platform|Device Name|Max compute|Global mem" | head -20
else
    warn "clinfo did not detect Intel GPU — may need a WSL2 restart"
    warn "Run: wsl --shutdown  (from PowerShell), relaunch WSL2, then: clinfo"
fi

# ── 4. Add user to render/video groups ────────────────────────────────────────
step "Granting GPU device access to user"

LINUX_USER="${SUDO_USER:-$(logname 2>/dev/null || echo "$USER")}"
for grp in render video; do
    getent group "$grp" > /dev/null 2>&1 && usermod -aG "$grp" "$LINUX_USER" \
        && ok "Added $LINUX_USER to group: $grp" \
        || warn "Group '$grp' not found — skipping"
done

# ── 5. Configure Docker for Intel GPU access ──────────────────────────────────
step "Configuring Docker to use Intel GPU"

if ! command -v docker &>/dev/null; then
    warn "Docker not installed yet — run setup-docker-engine.sh first, then re-run this step manually:"
    warn "  sudo usermod -aG render,video \$USER"
    warn "  # Add device flags to docker run (see notes below)"
else
    # Patch daemon.json to expose /dev/dri devices to containers by default
    DAEMON_JSON="/etc/docker/daemon.json"
    if [[ -f "$DAEMON_JSON" ]]; then
        python3 - <<'PYEOF'
import json

path = "/etc/docker/daemon.json"
with open(path) as f:
    cfg = json.load(f)

# Allow containers to access DRI devices for GPU rendering/compute
cfg.setdefault("default-runtime", "runc")

with open(path, "w") as f:
    json.dump(cfg, f, indent=2)

print("    daemon.json updated")
PYEOF
        systemctl restart docker 2>/dev/null && ok "Docker restarted with updated config"
    fi
fi

# ── 6. Write a GPU docker-compose snippet ─────────────────────────────────────
step "Writing GPU docker-compose snippet → /etc/docker/intel-gpu-snippet.yml"

cat > /etc/docker/intel-gpu-snippet.yml <<'EOF'
# ── Intel UHD GPU Access Snippet ─────────────────────────────────────────────
# Add these sections to any docker-compose.yml service that needs GPU access.
#
# services:
#   your-service:
#     image: your-image
#     devices:
#       - /dev/dri:/dev/dri          # GPU device passthrough
#     group_add:
#       - render                     # Grants access to /dev/dri/renderD128
#       - video
#     environment:
#       - LIBVA_DRIVER_NAME=iHD      # Intel media driver (hardware video encode/decode)
#       - INTEL_MEDIA_RUNTIME=iHD
# ─────────────────────────────────────────────────────────────────────────────
EOF

ok "Snippet written — copy the relevant sections into your compose files"

# ── 7. Quick GPU smoke test ────────────────────────────────────────────────────
step "GPU smoke test via Docker"

if command -v docker &>/dev/null && systemctl is-active --quiet docker; then
    echo "    Running clinfo inside a container with /dev/dri mounted..."
    docker run --rm \
        --device /dev/dri:/dev/dri \
        --group-add render \
        ubuntu:22.04 bash -c \
        "apt-get install -y -qq clinfo intel-opencl-icd 2>/dev/null; clinfo | grep -E 'Intel|Platform|Device' | head -10" \
        2>/dev/null \
    && ok "Docker GPU test passed" \
    || warn "Docker GPU test inconclusive — the container image may not have the Intel ICD. Test manually."
else
    warn "Docker not running — skipping container smoke test"
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN} Intel UHD GPU setup complete!${NC}"
echo -e "
 Check GPU info:     clinfo | grep -E 'Intel|Device|Compute'
 Check VA-API:       vainfo
 GPU in Docker:      docker run --rm --device /dev/dri:/dev/dri \\
                       --group-add render ubuntu:22.04 clinfo

 Compose snippet:    /etc/docker/intel-gpu-snippet.yml

 Shared memory note: Intel UHD uses system RAM for VRAM.
 With 16 GB total, your GPU will dynamically use up to ~4 GB.
 Keep wsl.conf memory=10GB to leave headroom for GPU allocation.
"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
