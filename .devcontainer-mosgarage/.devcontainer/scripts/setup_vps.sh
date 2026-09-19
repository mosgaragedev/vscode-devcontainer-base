#!/bin/bash
set -euo pipefail

# ==============================================================================
# CONFIGURATION - EDIT THESE VARIABLES
# ==============================================================================
USERS=("devops" "mosgarage" "ecampusdev")
SSH_PORT=2222 # Change default SSH port for security
TAILSCALE_AUTH_KEY="" # Optional: Get from Tailscale admin console for auto-login
BACKUP_PASSWORD="ChangeThisToAStrongPassword123!" # Password for Restic backup encryption
BACKUP_REPO="s3:s3.amazonaws.com/your-bucket-name/vps-backup" # Or use B2, Azure, etc.
AWS_ACCESS_KEY_ID="YOUR_AWS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET"

# Your SSH Public Key (Paste it here to auto-inject for all users)
SSH_PUB_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... your@email.com"

# ==============================================================================
# 1. SYSTEM UPDATE & ESSENTIALS
# ==============================================================================
echo "🔄 Updating system and installing essentials..."
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git vim nano htop tmux jq unzip software-properties-common \
    apt-transport-https ca-ca-certificates gnupg lsb-release ufw fail2ban \
    landscape-common fastfetch rsync cron

# ==============================================================================
# 2. USER CREATION & SSH SETUP
# ==============================================================================
echo "👥 Creating users and configuring SSH..."
for user in "${USERS[@]}"; do
    if ! id "$user" &>/dev/null; then
        useradd -m -s /bin/bash "$user"
        echo "$user ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/$user"
        chmod 440 "/etc/sudoers.d/$user"
    fi
    
    # Setup SSH directory
    mkdir -p "/home/$user/.ssh"
    echo "$SSH_PUB_KEY" > "/home/$user/.ssh/authorized_keys"
    chmod 700 "/home/$user/.ssh"
    chmod 600 "/home/$user/.ssh/authorized_keys"
    chown -R "$user:$user" "/home/$user/.ssh"
done

# ==============================================================================
# 3. HARDENED SECURITY
# ==============================================================================
echo "🔒 Hardening Security..."

# SSH Hardening
cat > /etc/ssh/sshd_config.d/hardening.conf <<EOF
Port $SSH_PORT
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

# UFW Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow $SSH_PORT/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# CrowdSec (Next-Gen Collaborative IDS/IPS)
echo "🛡️ Installing CrowdSec..."
curl -s https://install.crowdsec.net | sh

# Unattended Upgrades (Auto Security Patches)
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Restart SSH (Warning: Ensure you have a way back in if port changed!)
systemctl restart sshd

# ==============================================================================
# 4. DEVELOPER TOOLS & CONTAINERS
# ==============================================================================
echo "🛠️ Installing Developer Tools..."

# Docker & Docker Compose
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add users to docker group
for user in "${USERS[@]}"; do
    usermod -aG docker "$user"
done

# Node.js (via NVM) & Python
apt-get install -y python3-pip python3-venv
for user in "${USERS[@]}"; do
    su - "$user" -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    su - "$user" -c 'source ~/.nvm/nvm.sh && nvm install --lts'
done

# ==============================================================================
# 5. AI & IDE INTEGRATION (Cursor, VSCode, Claude, Qwen)
# ==============================================================================
echo "🤖 Setting up AI & IDE environments..."

# VS Code Server (Browser-based VS Code)
curl -fsSL https://code-server.dev/install.sh | sh
systemctl enable --now code-server@$USER # Starts for root, adjust if needed for specific users

# Ollama (Local LLM runner for Qwen, Llama3, etc.)
curl -fsSL https://ollama.com/install.sh | sh
systemctl enable ollama
# Pull a smart, lightweight model for coding (Qwen 2.5 Coder)
su - ollama -c "ollama pull qwen2.5-coder:7b" &

# Aider (AI Pair Programming in Terminal - works with Claude, OpenAI, Ollama)
pip3 install aider-chat --break-system-packages

# Setup Environment Variables for AI tools
for user in "${USERS[@]}"; do
    cat >> "/home/$user/.bashrc" <<EOF

# AI & IDE Aliases
alias aider='aider --model ollama/qwen2.5-coder:7b' # Default to local Qwen
alias aider-claude='aider --model claude-3-5-sonnet-20241022'
alias vscode='code-server --bind-addr 0.0.0.0:8080 --auth none'

# Export API Keys (Replace with your actual keys)
# export ANTHROPIC_API_KEY="sk-ant-..."
# export OPENAI_API_KEY="sk-..."
EOF
done

# ==============================================================================
# 6. AUTOMATED BACKUPS (Restic)
# ==============================================================================
echo "💾 Setting up Automated Backups..."
apt-get install -y restic

# Initialize Restic Repo
export RESTIC_PASSWORD="$BACKUP_PASSWORD"
export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
restic -r "$BACKUP_REPO" init || echo "Repo already initialized"

# Create backup script
cat > /usr/local/bin/vps-backup.sh <<EOF
#!/bin/bash
export RESTIC_PASSWORD="$BACKUP_PASSWORD"
export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"

# Backup home directories and docker volumes
restic -r "$BACKUP_REPO" backup /home /etc /var/lib/docker/volumes --exclude='.cache' --exclude='node_modules'

# Prune old backups (keep last 7 daily, 4 weekly, 12 monthly)
restic -r "$BACKUP_REPO" forget --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune
EOF
chmod +x /usr/local/bin/vps-backup.sh

# Add to Cron (Runs daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/vps-backup.sh >> /var/log/vps-backup.log 2>&1") | crontab -

# ==============================================================================
# 7. TAILSCALE (Easy WSL & Secure Connection)
# ==============================================================================
echo "🌐 Setting up Tailscale for secure WSL/VPS connection..."
curl -fsSL https://tailscale.com/install.sh | sh

if [ -n "$TAILSCALE_AUTH_KEY" ]; then
    tailscale up --authkey="$TAILSCALE_AUTH_KEY" --ssh
else
    echo "⚠️ Run 'tailscale up' manually to authenticate this VPS to your Tailnet."
fi

# ==============================================================================
# 8. CUSTOM BASHRC & MOTD (Special Effects)
# ==============================================================================
echo "✨ Customizing Shell and MOTD..."

# Custom MOTD
cat > /etc/update-motd.d/99-custom <<EOF
#!/bin/bash
fastfetch --logo ubuntu --color 1
echo ""
echo "🚀 Welcome to the DevOps Garage VPS"
echo "🛡️ Security: CrowdSec & Fail2ban Active"
echo "💾 Backups: Restic (Daily @ 3 AM)"
echo "🤖 AI: Ollama (Qwen) & Aider Ready"
echo ""
EOF
chmod +x /etc/update-motd.d/99-custom

# Apply custom bashrc tweaks to all users
for user in "${USERS[@]}"; do
    BASHRC="/home/$user/.bashrc"
    cat >> "$BASHRC" <<EOF

# === CUSTOM DEVOPS CONFIG ===
# Colorful Prompt with Git Branch
parse_git_branch() {
    git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/ (\1)/'
}
export PS1="\[\033[36m\]\u\[\033[m\]@\[\033[32m\]\h\[\033[33m\]\$(parse_git_branch)\[\033[00m\]:\[\033[34m\]\w\[\033[m\]\\$ "

# Useful Aliases
alias ll='ls -alFh --color=auto'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias dps='docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
alias dcp='docker compose'
alias ports='ss -tulnp'
alias mem='free -h'
alias disk='df -h'

# History tweaks
export HISTSIZE=10000
export HISTFILESIZE=20000
export HISTCONTROL=ignoreboth:erasedups
shopt -s histappend

# Load NVM
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
EOF
    chown "$user:$user" "$BASHRC"
done

echo "✅ Setup Complete!"
echo "🔑 IMPORTANT: If you changed the SSH port to $SSH_PORT, connect using: ssh -p $SSH_PORT user@your_vps_ip"
echo "🌐 To connect via WSL easily, install Tailscale on your Windows/WSL machine and use the Tailscale IP."