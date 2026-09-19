#!/bin/bash

# Auto VPS Setup Script - Basic
# This script automates the setup of a VPS.

set -e

# Function to check if the user is root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "This script must be run as root. Use 'sudo' to execute it."
        exit 1
    fi
}

# Function to update and upgrade the system
update_system() {
    echo "Updating and upgrading the system..."
    if [ -f /etc/debian_version ]; then
        apt update && apt upgrade -y
    elif [ -f /etc/redhat-release ]; then
        yum update -y
    else
        echo "Unsupported operating system."
        exit 1
    fi
    echo "System updated successfully."
}

# Function to install required tools
install_tools() {
    echo "Installing required tools..."
    if [ -f /etc/debian_version ]; then
        apt install -y dnsutils curl
    elif [ -f /etc/redhat-release ]; then
        yum install -y bind-utils curl
    fi
    echo "Required tools installed successfully."
}

# Function to set the hostname
set_hostname() {
    local hostname=""
    while true; do
        read -rp "Enter the new hostname: " hostname
        if host "$hostname" > /dev/null 2>&1; then
            hostnamectl set-hostname "$hostname"
            echo "Hostname set to $hostname."
            break
        else
            echo "The hostname $hostname does not have a valid A record. Please try again."
        fi
    done

    update_hosts_file "$hostname"
}

# Function to update /etc/hosts with the new hostname
update_hosts_file() {
    local new_hostname="$1"
    echo "Updating /etc/hosts with the new hostname: $new_hostname"

    # Backup the original /etc/hosts file
    cp /etc/hosts /etc/hosts.bak

    # Remove any previous hostname entries and add the new one
    sed -i '/127.0.1.1/d' /etc/hosts
    echo "127.0.1.1    $new_hostname" >> /etc/hosts

    echo "/etc/hosts updated successfully."
}

# Function to optionally set the timezone
set_timezone() {
    local set_tz=""
    read -rp "Do you want to set the timezone? (yes/no): " set_tz

    if [[ "$set_tz" == "yes" ]]; then
        echo "Available timezones:"
        timedatectl list-timezones | less

        local timezone=""
        read -rp "Enter your preferred timezone (e.g., 'Asia/Colombo'): " timezone
        if timedatectl set-timezone "$timezone"; then
            echo "Timezone set to $timezone."
        else
            echo "Failed to set timezone. Please ensure the input is valid."
        fi
    else
        echo "No timezone specified. Setting default timezone to Asia/Colombo..."
        timedatectl set-timezone "Asia/Colombo"
        echo "Default timezone set to Asia/Colombo."
    fi
}

# Function to change the SSH port
change_ssh_port() {
    local change_port=""
    read -rp "Do you want to change the SSH port? (yes/no): " change_port

    if [[ "$change_port" == "yes" ]]; then
        local new_port=""
        read -rp "Enter the new SSH port: " new_port

        # Update sshd_config
        sed -i "s/#Port 22/Port $new_port/" /etc/ssh/sshd_config
        echo "SSH port changed to $new_port."

        # Restart SSH service
        systemctl restart sshd
        echo "SSH service restarted."
    fi
}

# Function to restart the server
restart_server() {
    local restart=""
    read -rp "Do you want to restart the server now? (yes/no): " restart
    if [[ "$restart" == "yes" ]]; then
        echo "Restarting the server..."
        reboot
    else
        echo "Server restart skipped. Please reboot manually if required."
    fi
}

# Main script
main() {
    check_root
    update_system
    install_tools
    set_hostname
    set_timezone
    change_ssh_port
    restart_server
}

main
