#!/bin/bash
set -e

DPKG_ARCHITECTURE=$(dpkg --print-architecture)
case "${DPKG_ARCHITECTURE}" in
    amd64) GO_ARCH="amd64" ;;
    arm64) GO_ARCH="arm64" ;;
    *) GO_ARCH="${DPKG_ARCHITECTURE}" ;;
esac

PKG_DIR=/tmp/mosgarage-pkgs
mkdir -p "${PKG_DIR}"

echo "Installing Mike Farah yq v${YQ_VERSION}..."
curl -fsSLo /usr/local/bin/yq \
    "https://github.com/mikefarah/yq/releases/download/v${YQ_VERSION}/yq_linux_${GO_ARCH}"
chmod +x /usr/local/bin/yq

echo "Installing VS Code CLI..."
case "${DPKG_ARCHITECTURE}" in
    amd64) VSCODE_CLI_ARCH="x64" ;;
    arm64) VSCODE_CLI_ARCH="arm64" ;;
    *) echo "Unsupported architecture for VS Code CLI: ${DPKG_ARCHITECTURE}" >&2; exit 1 ;;
esac
curl -fsSL "https://update.code.visualstudio.com/latest/cli-linux-${VSCODE_CLI_ARCH}/stable" \
    -o "${PKG_DIR}/vscode-cli.tar.gz"
tar -C "${PKG_DIR}" -xzf "${PKG_DIR}/vscode-cli.tar.gz"
install -m 0755 "${PKG_DIR}/code" /usr/local/bin/code

echo "Installing Skaffold ${SKAFFOLD_VERSION}..."
curl -fsSLo /usr/local/bin/skaffold \
    "https://github.com/GoogleContainerTools/skaffold/releases/download/v${SKAFFOLD_VERSION}/skaffold-linux-${GO_ARCH}"
chmod +x /usr/local/bin/skaffold

echo "Installing Kubectl ${KUBECTL_VERSION}..."
curl -fsSLo "${PKG_DIR}/kubectl" \
    "https://dl.k8s.io/release/v${KUBECTL_VERSION}/bin/linux/${GO_ARCH}/kubectl"
install -m 0755 "${PKG_DIR}/kubectl" /usr/local/bin/kubectl

echo "Installing Helm ${HELM_VERSION}..."
curl -fsSLo "${PKG_DIR}/helm.tar.gz" \
    "https://get.helm.sh/helm-v${HELM_VERSION}-linux-${GO_ARCH}.tar.gz"
tar -C "${PKG_DIR}" -zxvf "${PKG_DIR}/helm.tar.gz"
install -m 0755 "${PKG_DIR}/linux-${GO_ARCH}/helm" /usr/local/bin/helm

echo "Installing Kubeseal ${KUBESEAL_VERSION}..."
curl -fsSLo "${PKG_DIR}/kubeseal.tar.gz" \
    "https://github.com/bitnami-labs/sealed-secrets/releases/download/v${KUBESEAL_VERSION}/kubeseal-${KUBESEAL_VERSION}-linux-${GO_ARCH}.tar.gz"
tar -C "${PKG_DIR}" -zxvf "${PKG_DIR}/kubeseal.tar.gz"
install -m 0755 "${PKG_DIR}/kubeseal" /usr/local/bin/kubeseal

echo "Installing k9s ${K9S_VERSION}..."
curl -fsSLo "${PKG_DIR}/k9s.tar.gz" \
    "https://github.com/derailed/k9s/releases/download/v${K9S_VERSION}/k9s_Linux_${GO_ARCH}.tar.gz"
tar -C "${PKG_DIR}" -zxvf "${PKG_DIR}/k9s.tar.gz"
install -m 0755 "${PKG_DIR}/k9s" /usr/local/bin/k9s

echo "Installing stern ${STERN_VERSION}..."
curl -fsSLo "${PKG_DIR}/stern.tar.gz" \
    "https://github.com/stern/stern/releases/download/v${STERN_VERSION}/stern_${STERN_VERSION}_linux_${GO_ARCH}.tar.gz"
tar -C "${PKG_DIR}" -zxvf "${PKG_DIR}/stern.tar.gz"
install -m 0755 "${PKG_DIR}/stern" /usr/local/bin/stern

rm -rf "${PKG_DIR}"

echo "✓ System dependencies installed"
