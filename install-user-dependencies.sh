#!/bin/bash
set -e

DPKG_ARCHITECTURE=$(dpkg --print-architecture)
KREW_BIN="${KREW_ROOT:-${HOME}/.krew}/bin"

echo "Installing Kubectl Plugins (krew)..."
KREW_DIR=/tmp/krew
mkdir -p "${KREW_DIR}"
curl -fsSLo "${KREW_DIR}/krew.tar.gz" \
    "https://github.com/kubernetes-sigs/krew/releases/latest/download/krew-linux_${DPKG_ARCHITECTURE}.tar.gz"
tar -C "${KREW_DIR}" -zxvf "${KREW_DIR}/krew.tar.gz"
"${KREW_DIR}/krew-linux_${DPKG_ARCHITECTURE}" install krew

export PATH="${KREW_BIN}:${PATH}"

# Install plugins one-by-one so a deprecated plugin never breaks the build.
for PLUGIN in neat debug-shell exec-cronjob whoami; do
    kubectl krew install "${PLUGIN}" || echo "Skipping krew plugin ${PLUGIN} (unavailable)"
done

mkdir -p "${HOME}/.zsh"
kubectl completion zsh > "${HOME}/.zsh/kubernetes.sh"

echo "Installing uv (fast Python tooling)..."
curl -fsSLo /tmp/uv-install.sh https://astral.sh/uv/install.sh
sh /tmp/uv-install.sh >/dev/null
export PATH="${HOME}/.local/bin:${PATH}"

if [ "${INSTALL_AI_TOOLS}" = "true" ]; then
    echo "Installing aider (AI pair programming)..."
    uv tool install --python python3.12 aider-chat || echo "aider install failed — continuing"
    if [ -f /usr/lib/node_modules/@anthropic-ai/claude-code/install.cjs ]; then
        echo "Installing Claude Code native binary..."
        node /usr/lib/node_modules/@anthropic-ai/claude-code/install.cjs \
            || echo "claude native install failed — continuing"
    fi
else
    echo "Skipping AI tools (INSTALL_AI_TOOLS=false)"
fi

echo "Installing Oh-My-ZSH..."
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "${HOME}/.oh-my-zsh/custom/themes/powerlevel10k"
git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git "${HOME}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting"
git clone --depth=1 https://github.com/supercrabtree/k "${HOME}/.oh-my-zsh/custom/plugins/k"
git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions "${HOME}/.oh-my-zsh/custom/plugins/zsh-autosuggestions"
git clone --depth=1 https://github.com/johanhaleby/kubetail.git "${HOME}/.oh-my-zsh/custom/plugins/kubetail"

# ADP tooling is only present in the internal build; the release image ships without it.
if [ -x /usr/local/bin/adp-connect ]; then
    echo "Installing ADP Tooling..."
    PATH="${HOME}/.local/bin:${PATH}" /usr/local/bin/adp-connect -D -I || {
        echo "ADP Tooling installation failed"
        exit 1
    }
fi

echo "✓ User dependencies installed"
