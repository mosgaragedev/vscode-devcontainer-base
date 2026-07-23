#!/usr/bin/env bash
# setup-docker-engine.sh
# Run this INSIDE your WSL2 distro (not in PowerShell).
#
# What it does:
#   1. Removes any Docker Desktop leftovers
#   2. Installs Docker Engine (official apt repo)
#   3. Drops in the daemon config
#   4. Enables Docker as a systemd service
#   5. Adds your user to the docker group (no sudo needed)
#   6. Sets up auto-prune via a systemd timer
#
# Usage:
#   chmod +x setup-docker-engine.sh && sudo ./setup-docker-engine.sh

set -euo pipefail

# ─── CONFIG ───────────────────────────────────────────────────────────────────
LINUX_USER="${SUDO_USER:-$(logname 2>/dev/null || echo "$USER")}"
# ──────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
step()  { echo -e "\n${CYAN}[+] $*${NC}"; }
ok()    { echo -e "    ${GREEN}OK${NC}  $*"; }
warn()  { echo -e "    ${YELLOW}!!${NC}  $*"; }
fail()  { echo -e "    ${RED}ERR${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && fail "Run with sudo: sudo ./setup-docker-engine.sh"

# ── 1. Remove Docker Desktop leftovers ────────────────────────────────────────
step "Removing Docker Desktop traces"

# Docker Desktop injects a docker binary override — undo that
DOCKER_DESKTOP_PATHS=(
    "/usr/local/bin/com.docker.cli"
    "/usr/bin/docker-credential-desktop"
    "/usr/bin/docker-credential-ecr-login"
    "/usr/bin/docker-credential-pass"
)
for f in "${DOCKER_DESKTOP_PATHS[@]}"; do
    [[ -f "$f" ]] && rm -f "$f" && warn "Removed: $f"
done

# Remove Docker Desktop config entries that override the socket path
DOCKER_CONFIG="/home/${LINUX_USER}/.docker/config.json"
if [[ -f "$DOCKER_CONFIG" ]]; then
    # Strip out the credsStore and currentContext keys set by Docker Desktop
    python3 -c "
import json, sys
with open('$DOCKER_CONFIG') as f:
    cfg = json.load(f)
for key in ['credsStore', 'currentContext']:
    cfg.pop(key, None)
cfg.get('auths', {})  # keep auth entries
with open('$DOCKER_CONFIG', 'w') as f:
    json.dump(cfg, f, indent=2)
" 2>/dev/null && ok "Cleaned Docker config.json" || warn "Could not clean config.json — check manually"
fi

ok "Docker Desktop traces removed"

# ── 2. Install Docker Engine ───────────────────────────────────────────────────
step "Installing Docker Engine"

# Fix known broken third-party repo keys before running apt-get update.
# Google Cloud SDK repo frequently has an expired/missing key — patch it silently.
if [[ -f /etc/apt/sources.list.d/google-cloud-sdk.list ]]; then
    warn "Google Cloud SDK repo detected — refreshing its GPG key to avoid apt errors"
    curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
        | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg 2>/dev/null \
        && ok "Google Cloud SDK key refreshed" \
        || {
            warn "Could not refresh key — disabling Google Cloud SDK repo temporarily"
            mv /etc/apt/sources.list.d/google-cloud-sdk.list \
               /etc/apt/sources.list.d/google-cloud-sdk.list.bak
            GCLOUD_REPO_DISABLED=true
        }
fi

# -o ... AllowInsecureRepositories=false still errors on bad repos,
# so we use --ignore-missing-keys equivalent: run update and continue on partial failure
apt-get update -qq 2>&1 | grep -v "^W:\|^N:" || true

apt-get install -y -qq ca-certificates curl gnupg lsb-release

# Re-enable Google Cloud SDK repo if we disabled it
if [[ "${GCLOUD_REPO_DISABLED:-false}" == "true" ]]; then
    mv /etc/apt/sources.list.d/google-cloud-sdk.list.bak \
       /etc/apt/sources.list.d/google-cloud-sdk.list
    warn "Google Cloud SDK repo re-enabled. Run: sudo apt-get update to verify it's clean."
fi

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker apt repo
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

ok "Docker Engine installed: $(docker --version)"

# ── 3. Drop in daemon config ───────────────────────────────────────────────────
step "Configuring Docker daemon"

mkdir -p /etc/docker
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "${SCRIPT_DIR}/docker-daemon.json" ]]; then
    cp "${SCRIPT_DIR}/docker-daemon.json" /etc/docker/daemon.json
    ok "Installed daemon.json from script directory"
else
    warn "docker-daemon.json not found next to this script — writing defaults"
    cat > /etc/docker/daemon.json <<'EOF'
{
  "features": { "buildkit": true },
  "log-driver": "local",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "storage-driver": "overlay2",
  "live-restore": true
}
EOF
fi

# ── 4. Enable Docker as a systemd service ─────────────────────────────────────
step "Enabling Docker service"

systemctl daemon-reload
systemctl enable docker
systemctl start docker

sleep 2
systemctl is-active --quiet docker && ok "Docker daemon is running" || fail "Docker daemon failed to start"

# ── 5. Add user to docker group ───────────────────────────────────────────────
step "Adding '$LINUX_USER' to docker group"

usermod -aG docker "$LINUX_USER"
ok "Done — you'll need to log out and back in (or run: newgrp docker)"

# ── 6. Auto-prune via systemd timer ───────────────────────────────────────────
step "Setting up auto-prune (daily, 3 AM)"

# The prune script
cp "${SCRIPT_DIR}/docker-prune.sh" /usr/local/bin/docker-prune.sh 2>/dev/null || cat > /usr/local/bin/docker-prune.sh <<'PRUNE'
#!/usr/bin/env bash
# Installed by setup-docker-engine.sh
/usr/bin/docker system prune -af --volumes >> /var/log/docker-prune.log 2>&1
PRUNE
chmod +x /usr/local/bin/docker-prune.sh

# systemd service unit
cat > /etc/systemd/system/docker-prune.service <<'EOF'
[Unit]
Description=Docker system prune
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/docker-prune.sh
EOF

# systemd timer unit — runs daily at 3 AM
cat > /etc/systemd/system/docker-prune.timer <<'EOF'
[Unit]
Description=Run Docker prune daily at 3 AM

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable docker-prune.timer
systemctl start  docker-prune.timer

systemctl is-active --quiet docker-prune.timer \
    && ok "Auto-prune timer active (daily at 3 AM)" \
    || warn "Timer registered but not yet active — check: systemctl status docker-prune.timer"

# ── Done ───────────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN} Docker Engine setup complete!${NC}"
echo -e "
 Verify:          docker info
 Compose:         docker compose version
 Prune timer:     systemctl list-timers docker-prune.timer
 Prune logs:      tail -f /var/log/docker-prune.log
"
echo -e "${YELLOW} Next: run setup-intel-gpu.sh for GPU support.${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
