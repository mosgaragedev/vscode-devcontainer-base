#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${VSCODE_CLI_DATA_DIR:-${HOME}/.vscode-cli}"
LOG_FILE="${DATA_DIR}/code-tunnel.log"

if ! command -v code >/dev/null 2>&1; then
    echo "VS Code CLI is not installed; skipping code tunnel."
    exit 0
fi

if pgrep -u "$(id -u)" -f '(^|/)code tunnel' >/dev/null 2>&1; then
    echo "VS Code tunnel is already running."
    exit 0
fi

mkdir -p "${DATA_DIR}"
touch "${LOG_FILE}"

nohup code tunnel --accept-server-license-terms --no-sleep \
    >>"${LOG_FILE}" 2>&1 &

TUNNEL_PID=$!
echo "Started VS Code tunnel (pid ${TUNNEL_PID}); log: ${LOG_FILE}"
echo "If this is the first run, authenticate with: code tunnel user login"
