#!/usr/bin/env bash
# HEALTHCHECK — must exit 0 for healthy, 1 for unhealthy
set -e
curl -sf --max-time 5 http://127.0.0.1:3000/status > /dev/null
curl -sf --max-time 5 http://127.0.0.1:4000/api/v1/health > /dev/null
exit 0
