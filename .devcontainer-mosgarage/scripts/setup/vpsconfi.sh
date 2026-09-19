#!/bin/bash

# Variables
REMOTE_USER="your_username"       # Replace with your VPS username
REMOTE_HOST="your_vps_ip"         # Replace with your VPS IP address
SSH_PORT=22                       # Default SSH port (change if needed)
LOCAL_SSH_KEY="$HOME/.ssh/id_rsa.pub"  # Path to your local public SSH key

# Check if SSH key exists
if [ ! -f "$LOCAL_SSH_KEY" ]; then
    echo "SSH key not found at $LOCAL_SSH_KEY. Generating a new SSH key..."
    ssh-keygen -t rsa -b 4096 -f "${LOCAL_SSH_KEY%.*}" -N ""
fi

# Copy SSH key to the remote VPS
echo "Copying SSH key to the remote VPS..."
ssh-copy-id -i "$LOCAL_SSH_KEY" -p $SSH_PORT "$REMOTE_USER@$REMOTE_HOST"

# Test SSH connection
echo "Testing SSH connection..."
ssh -p $SSH_PORT "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH setup successful!'"

echo "SSH setup completed!"
