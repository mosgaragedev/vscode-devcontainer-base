#!/usr/bin/env bash
# ============================================================
# mosgarage · .devcontainer/scripts/post-start.sh
# Runs every time the devcontainer starts (not just first time).
# ============================================================

set -euo pipefail

cd /workspace

echo "[post-start] mosgarage devcontainer ready"

# ── Ensure dotnet tools are in PATH ──────────────────────────────
export PATH="$PATH:/root/.dotnet/tools"

# ── Ensure Docker socket permissions ─────────────────────────────
if [[ -S /var/run/docker.sock ]]; then
  chmod 666 /var/run/docker.sock 2>/dev/null || true
fi

# ── Ensure Unix socket dir is writable ───────────────────────────
mkdir -p /var/run && chmod 1777 /var/run 2>/dev/null || true

# ── Quick db connectivity check ───────────────────────────────────
if pg_isready -h database -U mosgarage -d mosgarage -q 2>/dev/null; then
  echo "[post-start] PostgreSQL ✅"
else
  echo "[post-start] PostgreSQL ⚠️  not ready yet (will retry on first request)"
fi

echo "[post-start] done — open a terminal and run: server"
