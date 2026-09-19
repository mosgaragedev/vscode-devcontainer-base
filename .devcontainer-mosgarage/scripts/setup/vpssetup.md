sudo apt update && sudo apt install git -y
git clone https://github.com/sinhalaya/Auto-VPS-Setup-Script.git
cd Auto-VPS-Setup-Script

Automating VPS setup with scripts can save time and ensure consistency. Below are two popular approaches to automate VPS configuration and management.

1. Auto VPS Setup Script

This script automates the initial setup of a VPS, including hostname configuration, SSH port changes, timezone setup, and more.

Steps to Use:

Clone the Repository:

sudo apt update && sudo apt install git -y
git clone https://github.com/sinhalaya/Auto-VPS-Setup-Script.git
cd Auto-VPS-Setup-Script
Copy
Make the Script Executable:

chmod +x auto_setup_vps.sh
Copy
Run the Script: Execute the script with elevated privileges:

sudo ./auto_setup_vps.sh
Copy
Features:

Detects operating system.

Updates and upgrades the system.

Configures hostname with DNS validation.

Allows SSH port customization for security.

Sets timezone (default: Asia/Colombo).

Optionally restarts the server to apply changes.

2. Script for SSH and VPN Services

This script is designed for setting up SSH, VPN, and other services on a VPS.

Steps to Install:

Run the Installation Command:

apt update && apt upgrade -y && apt install -y wget screen
wget -q https://raw.githubusercontent.com/scvps/scriptvps/main/setup.sh
chmod +x setup.sh
screen -S setup ./setup.sh
Copy
Follow On-Screen Prompts: The script will guide you through configuring services like OpenSSH, WireGuard, Shadowsocks, and more.

Features:

Auto-installs SSH, VPN (WireGuard, SSTP), and proxy services.

Supports Debian 10, Ubuntu 18.04/20.04.

Includes auto-backup, multi-login prevention, and auto-reboot features.

Allows port customization and admin control.

Best Practices

Always review scripts before running them to ensure they meet your security standards.

Use a test environment to validate configurations before deploying to production servers.

Regularly update scripts to incorporate the latest security patches and features.