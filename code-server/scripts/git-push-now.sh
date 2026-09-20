#!/usr/bin/env bash
# git-push-now — trigger immediate sync
TRIGGER="/tmp/mosgarage-git-push-now"
touch "${TRIGGER}"
echo "[git-push-now] Trigger set — daemon will push within 5s"
for i in $(seq 1 30); do
  sleep 1
  [[ ! -f "${TRIGGER}" ]] && { echo "✅ Sync complete"; tail -15 /var/log/mosgarage/git-sync.log; exit 0; }
done
echo "⚠️  Daemon did not respond in 30s. Check: supervisorctl status git-sync"
exit 1
