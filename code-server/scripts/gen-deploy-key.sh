#!/usr/bin/env bash
set -euo pipefail
KEY_DIR="./ssh-keys"; KEY_FILE="${KEY_DIR}/id_ed25519"
GITHUB_ORG="mosgarage"; GITHUB_REPO="mosgaragedev"
mkdir -p "${KEY_DIR}"; chmod 700 "${KEY_DIR}"
[[ -f "${KEY_FILE}" ]] && { read -rp "Key exists. Overwrite? [y/N] " c; [[ "${c,,}" != "y" ]] && exit 0; }
ssh-keygen -t ed25519 -C "mosgarage-container@github.com/${GITHUB_ORG}/${GITHUB_REPO}" -f "${KEY_FILE}" -N ""
chmod 600 "${KEY_FILE}"; chmod 644 "${KEY_FILE}.pub"
echo ""
echo "✅ Key generated:"
echo "   Private: ${KEY_FILE}  (mount into container via SSH_KEY_PATH in .env)"
echo "   Public:  ${KEY_FILE}.pub  (add as deploy key on GitHub)"
echo ""
echo "══ PUBLIC KEY — add at: https://github.com/${GITHUB_ORG}/${GITHUB_REPO}/settings/keys ══"
cat "${KEY_FILE}.pub"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "In .env set:  SSH_KEY_PATH=./ssh-keys/id_ed25519"
echo ""
command -v gh >/dev/null && {
  read -rp "Auto-add via GitHub CLI? [y/N] " a
  [[ "${a,,}" == "y" ]] && gh repo deploy-key add "${KEY_FILE}.pub" \
    --repo "${GITHUB_ORG}/${GITHUB_REPO}" --title "mosgarage-container" --allow-write \
    && echo "✅ Deploy key added!"
} || true
