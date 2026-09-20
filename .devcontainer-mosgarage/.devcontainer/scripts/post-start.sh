#!/usr/bin/env bash
# =============================================================================
# post-start.sh — runs every time the devcontainer starts
# Lightweight: just verifies connectivity, no heavy setup
# =============================================================================
set -euo pipefail

info() { echo -e "\033[1;36m[mosgarage]\033[0m $*"; }
ok()   { echo -e "\033[1;32m[  ok  ]\033[0m $*"; }
warn() { echo -e "\033[1;33m[ warn ]\033[0m $*"; }

echo ""
info "mosgarage devcontainer starting..."
echo ""

# Quick connectivity check for each DB
check_postgres() {
    if psql postgresql://mosgarage:mosgarage@postgres:5432/mosgarage -c '\q' 2>/dev/null; then
        ok "PostgreSQL  → connected"
    else
        warn "PostgreSQL  → not ready yet (run: docker compose up postgres)"
    fi
}

check_mongo() {
    if mongosh "mongodb://mosgarage:mosgarage@mongodb:27017/mosgarage" --eval "db.runCommand({ping:1})" --quiet 2>/dev/null | grep -q 'ok'; then
        ok "MongoDB     → connected"
    else
        warn "MongoDB     → not ready yet"
    fi
}

check_redis() {
    if redis-cli -h redis -p 6379 -a mosgarage ping 2>/dev/null | grep -q PONG; then
        ok "Redis       → connected"
    else
        warn "Redis       → not ready yet"
    fi
}

check_postgres
check_mongo
check_redis

echo ""
info "Service URLs (when running):"
echo "    API Gateway    → http://localhost:3000"
echo "    Auth Service   → http://localhost:3001"
echo "    Content        → http://localhost:3002"
echo "    Learner        → http://localhost:3003"
echo "    Notifications  → http://localhost:3004"
echo ""
info "DB Admin UIs:"
echo "    Mongo Express  → http://localhost:8081"
echo "    Redis Cmdr     → http://localhost:8082"
echo ""
info "Start services: mg-up | View logs: mg-logs | Status: mg-ps"
echo ""
