#!/usr/bin/env bash
set -euo pipefail

# claude-polyglot: Run the Claude Code Polyglot development container
# Usage: claude-polyglot [OPTIONS]
#
# Options:
#   --build         Build the container image before running
#   --no-config     Don't mount Claude Code configuration
#   --no-history    Don't mount command history
#   --network       Disable DNS filtering (allow all network access)
#   --yolo          Run claude --dangerously-skip-permissions
#   --help          Show this help message
#
# Examples:
#   claude-polyglot                    # Run with DNS filtering (Claude API only)
#   claude-polyglot --build            # Rebuild and run
#   claude-polyglot --network          # Run with full network access
#   claude-polyglot --yolo             # Run Claude without permission checks
#   claude-polyglot zsh                # Run with zsh command
#   claude-polyglot cargo build        # Run Rust cargo
#   claude-polyglot python3 script.py  # Run Python script
#   claude-polyglot swipl -s file.pl   # Run Prolog file
#   claude-polyglot ruff check .       # Run ruff linter
# END_HELP

IMAGE_NAME="claude-polyglot:latest"
BUILD=false
MOUNT_CONFIG=true
MOUNT_HISTORY=true
UNRESTRICTED_NETWORK=false
YOLO_MODE=false
DOCKER_ARGS=()
COMMAND_ARGS=()

# Whitelisted domains for DNS filtering
WHITELISTED_DOMAINS=(
    "api.anthropic.com"
    "claude.ai"
)

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --no-config)
            MOUNT_CONFIG=false
            shift
            ;;
        --no-history)
            MOUNT_HISTORY=false
            shift
            ;;
        --network)
            UNRESTRICTED_NETWORK=true
            shift
            ;;
        --yolo)
            YOLO_MODE=true
            shift
            ;;
        --help)
            sed -n '/^# claude-polyglot:/,/^# END_HELP/p' "$0" | sed 's/^# //' | sed 's/^#$//' | grep -v '^END_HELP$'
            exit 0
            ;;
        *)
            COMMAND_ARGS+=("$1")
            shift
            ;;
    esac
done

# Build if requested
if [ "$BUILD" = true ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    echo "Building $IMAGE_NAME..."
    docker build -t "$IMAGE_NAME" "$SCRIPT_DIR"
fi

# Check if image exists
if ! docker image inspect "$IMAGE_NAME" &>/dev/null; then
    echo "Error: Image $IMAGE_NAME not found."
    echo "Build it with: docker build -t $IMAGE_NAME /path/to/container/polyglot"
    echo "Or run: $(basename "$0") --build"
    exit 1
fi

# Setup volume mounts
DOCKER_ARGS+=(
    "-v" "$(pwd):/workspace"
)

if [ "$MOUNT_CONFIG" = true ] && [ -d "$HOME/.claude" ]; then
    DOCKER_ARGS+=("-v" "$HOME/.claude:/home/node/.claude")
fi

if [ "$MOUNT_HISTORY" = true ]; then
    DOCKER_ARGS+=("-v" "claude-polyglot-history:/commandhistory")
fi

# DNS filtering by default, unrestricted network when --network is specified
if [ "$UNRESTRICTED_NETWORK" = false ]; then
    # Enable network but filter DNS - only allow whitelisted domains
    echo "Enabling DNS filtering (Claude API access only)..."

    # Resolve whitelisted domains and add as host entries
    for domain in "${WHITELISTED_DOMAINS[@]}"; do
        # Resolve domain to IP addresses
        ips=$(dig +short "$domain" 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$')

        if [ -n "$ips" ]; then
            # Add first IP as host entry
            first_ip=$(echo "$ips" | head -1)
            DOCKER_ARGS+=("--add-host" "${domain}:${first_ip}")
            echo "  ✓ ${domain} -> ${first_ip}"
        else
            echo "  ⚠ Warning: Could not resolve ${domain}"
        fi
    done

    # Set DNS to non-existent server to block all other lookups
    DOCKER_ARGS+=("--dns" "0.0.0.0")
else
    echo "DNS filtering disabled - full network access enabled"
fi

# If no command specified, run interactive shell or Claude in YOLO mode
if [ ${#COMMAND_ARGS[@]} -eq 0 ]; then
    DOCKER_ARGS+=("-it")
    if [ "$YOLO_MODE" = true ]; then
        COMMAND_ARGS=("claude" "--dangerously-skip-permissions")
    else
        COMMAND_ARGS=("zsh")
    fi
else
    # If command is provided, determine if we need interactive mode
    case "${COMMAND_ARGS[0]}" in
        bash|zsh|sh|claude)
            DOCKER_ARGS+=("-it")
            ;;
        swipl|python|python3|ipython)
            # Only interactive if no additional arguments
            if [ ${#COMMAND_ARGS[@]} -eq 1 ]; then
                DOCKER_ARGS+=("-it")
            fi
            ;;
    esac
fi

# Run the container
exec docker run --rm "${DOCKER_ARGS[@]}" "$IMAGE_NAME" "${COMMAND_ARGS[@]}"