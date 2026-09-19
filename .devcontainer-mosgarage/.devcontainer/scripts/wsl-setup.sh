#!/bin/bash
set -euo pipefail

# ==============================================================================
# CONFIGURATION
# ==============================================================================
USERS=("devops" "mosgarage" "ecampusdev")
BACKUP_PASSWORD="Password123."
BACKUP_REPO="s3:s3.amazonaws.com/your-bucket-name/wsl-backup"
AWS_ACCESS_KEY_ID="YOUR_AWS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET"
SSH_PUB_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... your@email.com"

# ==============================================================================
# 0. RESET MODE (If passed --reset)
# ==============================================================================
if [[ "${1:-}" == "--reset" ]]; then
    echo "🧹 [RESET MODE] Cleaning up previous configurations (Preserving /home and /root)..."
    rm -rf /etc/ssh/sshd_config.d/*
    rm -rf /etc/update-motd.d/99-custom
    rm -f /usr/local/bin/vps-backup.sh
    apt-get autoremove --purge -y
    apt-get clean
    echo "✅ Reset complete. Proceeding with fresh setup..."
fi

# ==============================================================================
# 1. WSL SPECIFIC CONFIGURATION (Systemd & Interop)
# ==============================================================================
echo "⚙️ Configuring WSL2 specifics..."
cat > /etc/wsl.conf <<EOF
[boot]
systemd=true

[automount]
options = "metadata,umask=22,fmask=11"
mountFstab=true

[interop]
enabled=true
appendWindowsPath=true
EOF

# ==============================================================================
# 2. SYSTEM UPDATE & ESSENTIALS (No Firewalls/IDS for WSL)
# ==============================================================================
echo "🔄 Updating system and installing essentials..."
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git vim nano htop tmux jq unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release rsync cron \
    build-essential pkg-config libssl-dev

# ==============================================================================
# 3. USER CREATION & SSH (Lightweight for local use)
# ==============================================================================
echo "👥 Configuring users..."
for user in "${USERS[@]}"; do
    if ! id "$user" &>/dev/null; then
        useradd -m -s /bin/bash "$user"
        echo "$user ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/$user"
        chmod 440 "/etc/sudoers.d/$user"
    fi
    
    mkdir -p "/home/$user/.ssh"
    echo "$SSH_PUB_KEY" > "/home/$user/.ssh/authorized_keys"
    chmod 700 "/home/$user/.ssh"
    chmod 600 "/home/$user/.ssh/authorized_keys"
    chown -R "$user:$user" "/home/$user/.ssh"
done

# ==============================================================================
# 4. DEVELOPER TOOLS & CONTAINERS
# ==============================================================================
echo "🛠️ Installing Developer Tools..."

# Docker (Note: If you use Docker Desktop, you can skip this and just enable WSL integration in Docker Desktop settings)
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

for user in "${USERS[@]}"; do
    usermod -aG docker "devops"
done

# Node.js & Python
apt-get install -y python3-pip python3-venv
for user in "${USERS[@]}"; do
    su - "$user" -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    su - "$user" -c 'source ~/.nvm/nvm.sh && nvm install --lts'
done

# ==============================================================================
# 5. AI & NATIVE IDE INTEGRATION (Cursor / VS Code)
# ==============================================================================
echo "🤖 Setting up AI & Native IDE environments..."

# Ollama (Local LLM)
curl -fsSL https://ollama.com/install.sh | sh
# Pull Qwen for coding
su - ollama -c "ollama pull qwen2.5-coder:7b" &

# Aider (AI Pair Programming)
pip3 install aider-chat --break-system-packages

# VS Code CLI (Crucial for Native WSL Extension integration)
# This allows Windows Cursor/VSCode to seamlessly talk to WSL
curl -fsSL https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-x64 | tar -xz -C /usr/local/bin --transform='s/.*/code/'

for user in "${USERS[@]}"; do
    cat >> "/home/$user/.bashrc" <<EOF

# AI Aliases
alias aider='aider --model ollama/qwen2.5-coder:7b'
alias aider-claude='aider --model claude-3-5-sonnet-20241022'
EOF
done

# ==============================================================================
# 6. AUTOMATED BACKUPS (Restic)
# ==============================================================================
echo "💾 Setting up Automated Backups..."
apt-get install -y restic

export RESTIC_PASSWORD="$BACKUP_PASSWORD"
export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
restic -r "$BACKUP_REPO" init || echo "Repo already initialized"

cat > /usr/local/bin/wsl-backup.sh <<EOF
#!/bin/bash
export RESTIC_PASSWORD="$BACKUP_PASSWORD"
export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"

# Backup home directories (skip heavy node_modules/cache)
restic -r "$BACKUP_REPO" backup /home /root --exclude='.cache' --exclude='node_modules' --exclude='.ollama'
restic -r "$BACKUP_REPO" forget --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune
EOF
chmod +x /usr/local/bin/wsl-backup.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/wsl-backup.sh >> /var/log/wsl-backup.log 2>&1") | crontab -

# ==============================================================================
# 7. TAILSCALE (WSL Optimized)
# ==============================================================================
echo "🌐 Setting up Tailscale for WSL..."
curl -fsSL https://tailscale.com/install.sh | sh
# Because WSL2 IPs change on reboot, Tailscale must run via systemd
systemctl enable tailscaled

# ==============================================================================
# 8. CUSTOM BASHRC & MOTD (WSL Special Effects)
# ==============================================================================
echo "✨ Customizing Shell and MOTD..."

apt-get install -y fastfetch

cat > /etc/update-motd.d/99-custom <<EOF
#!/bin/bash
fastfetch --logo ubuntu --color 1
echo ""
echo "🪟 Welcome to the WSL2 Dev Environment"
echo "🤖 AI: Ollama (Qwen) & Aider Ready"
echo "💾 Backups: Restic (Daily @ 3 AM)"
echo "💡 Tip: Open this folder in Cursor/VSCode via the WSL Extension!"
echo ""
EOF
chmod +x /etc/update-motd.d/99-custom

for user in "${USERS[@]}"; do
    BASHRC="/home/$user/.bashrc"
    cat >> "$BASHRC" <<EOF

# === WSL DEVOPS CONFIG ===
# Colorful Prompt with Git Branch
parse_git_branch() { git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/ (\1)/'; }
export PS1="\[\033[36m\]\u\[\033[m\]@\[\033[32m\]wsl\[\033[33m\]\$(parse_git_branch)\[\033[00m\]:\[\033[34m\]\w\[\033[m\]\\$ "

# WSL Specific Interop Aliases
alias winhome='cd /mnt/c/Users/\$(cmd.exe /C "echo %USERNAME%" | tr -d "\r")'
alias explorer='explorer.exe .'
alias clip='clip.exe'
alias code='code.exe' # Opens VS Code/Cursor on Windows in current WSL dir

# Standard DevOps Aliases
alias ll='ls -alFh --color=auto'
alias dps='docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
alias dcp='docker compose'

# History tweaks
export HISTSIZE=10000
export HISTFILESIZE=20000
shopt -s histappend

# Load NVM
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
EOF
    chown "$user:$user" "$BASHRC"
done

echo "✅ WSL Setup Complete!"
echo "🔄 Please restart WSL from Windows PowerShell to apply systemd changes:"
echo "   wsl --shutdown"