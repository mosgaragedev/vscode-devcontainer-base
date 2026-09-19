
# Auto VPS Setup Script - Basic

This script automates the initial setup of a VPS (Virtual Private Server). It performs the following tasks:

1. **OS Detection**: Automatically detects the operating system.
2. **System Update & Upgrade**: Ensures the system is up-to-date.
3. **Required Tools Installation**: Installs necessary tools like `dnsutils` or `bind-utils` for hostname validation.
4. **Hostname Configuration**: Prompts the user to enter a hostname, validates its DNS A record, and applies it.
5. **Timezone Setup**: Allows timezone configuration with `Asia/Colombo` as the default if skipped.
6. **SSH Port Change**: Provides an option to change the SSH port for added security.
7. **Server Restart**: Optionally restarts the server after setup.

---

## Prerequisites

Ensure your VPS has access to the internet and supports the following commands:
- `hostnamectl`
- `timedatectl`
- `host`
- `sed`
- `systemctl`

---

## Installation and Usage

### 1. Install Git and Clone the Repository

If Git is not installed on your system, follow these steps to install it:

#### For Debian-based Systems (Ubuntu, Debian):
```bash
sudo apt update
sudo apt install git -y
```

#### For RHEL-based Systems (CentOS, Fedora):
```bash
sudo yum install git -y
```

#### For Arch-based Systems:
```bash
sudo pacman -S git
```

Once Git is installed, clone the repository:
```bash
git clone https://github.com/sinhalaya/Auto-VPS-Setup-Script.git
cd Auto-VPS-Setup-Script
```

### 2. Make the Script Executable
```bash
chmod +x auto_setup_vps.sh
```

### 3. Run the Script
Run the script with `sudo`:
```bash
sudo ./auto_setup_vps.sh
```

---



## Workflow

1. The script detects the operating system.
2. It updates and upgrades the system to the latest release.
3. It installs necessary tools like `dnsutils` or `bind-utils`.
4. Prompts the user to:
   - Set a hostname (with A record validation).
   - Configure the server timezone.
   - Change the SSH port for enhanced security.
5. Optionally restarts the server to apply changes.

---

## Steps to Delete the Downloaded Script

Remove the Script File - Assuming the script is named auto_setup_vps.sh and located in your current working directory
```bash
rm -f auto_setup_vps.sh
```
Remove the Entire Script Folder (Optional) - If you cloned the GitHub repository or saved the script in a directory, delete the entire folder
```bash
rm -rf Auto-VPS-Setup-Script
```
Confirm Deletion
```bash
ls
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
