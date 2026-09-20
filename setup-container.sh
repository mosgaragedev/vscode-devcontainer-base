#!/bin/bash
# Configures the container after startup: hooks, kubeconfig, helm repos,
# code-server settings, and the cron backup daemon.
PRE_CONFIG_HOOKS=/usr/local/lib/devcontainer/hooks.d/pre-start
POST_CONFIG_HOOKS=/usr/local/lib/devcontainer/hooks.d/post-start
USERNAME=mosgarage
USER_HOME=/home/${USERNAME}

run_hooks() {
    local LABEL="$1"
    local DIR="$2"
    if [[ -d "${DIR}" ]] && [[ -n "$(ls -A "${DIR}" 2>/dev/null)" ]]; then
        echo "Running ${LABEL} hooks..."
        for HOOK in "${DIR}"/*; do
            echo " - ${HOOK}..."
            if [[ -x "${HOOK}" ]]; then
                "${HOOK}"
            else
                bash "${HOOK}"
            fi
        done
    fi
}

run_hooks "user pre-configure" "${HOST_HOME}/.devcontainer/hooks.d/pre-start"
run_hooks "image pre-configure" "${PRE_CONFIG_HOOKS}"

mkdir -p "${USER_HOME}/.docker" "${USER_HOME}/.kube" "${USER_HOME}/.config/helm" || true

if [[ -z "${HOST_HOME}" ]]; then
    echo "Warning: HOST_HOME environment variable is not set, unable to setup user customizations. This means that things like docker, helm, kubectl, and skaffold will not work" 1>&2
elif [[ ! -d "${HOST_HOME}" ]]; then
    echo "Warning: Your home directory does not seem to be available at ${HOST_HOME}. This means things like docker, helm, kubectl, and skaffold will not work" 1>&2
else
    echo "Setting up Kubernetes..."

    if [[ ! -e "${HOST_HOME}/.kube/config" ]]; then
        echo "Warning: Kubeconfig not found in ${HOST_HOME}/.kube/config. Your Kubernetes cluster will not be accessible until you provide one and restart this container." 1>&2
    else
        echo "✓ Found kubeconfig at ${HOST_HOME}/.kube/config"
        sudo cp "${HOST_HOME}/.kube/config" "${USER_HOME}/.kube/config"
        sudo chown ${USERNAME}:${USERNAME} "${USER_HOME}/.kube/config"
    fi

    echo "Setting up Helm..."

    HELM_REPOSITORIES_YAML="${USER_HOME}/.config/helm/repositories.yaml"
    HOST_HELM_REPOSITORIES_YAML=""
    OHIO_HELM_REPOSITORIES_YAML=""
    for HOST_HELM in "${HOST_HOME}/.config/helm/repositories.yaml" "${HOST_HOME}/Library/Preferences/helm/repositories.yaml"; do
        if [[ -e "${HOST_HELM}" ]]; then
            HOST_HELM_REPOSITORIES_YAML="${HOST_HELM}"
            echo "✓ Found Helm repositories configuration at ${HOST_HELM_REPOSITORIES_YAML}"
        fi
    done

    if [[ -e "${HOST_HOME}/.config/helm/repositories-ohio.yaml" ]]; then
        OHIO_HELM_REPOSITORIES_YAML="${HOST_HOME}/.config/helm/repositories-ohio.yaml"
        echo "✓ Found Ohio Helm repositories configuration at ${OHIO_HELM_REPOSITORIES_YAML}"
    elif [[ -e "${HOST_HOME}/Library/Preferences/helm/repositories-ohio.yaml" ]]; then
        OHIO_HELM_REPOSITORIES_YAML="${HOST_HOME}/Library/Preferences/helm/repositories-ohio.yaml"
        echo "✓ Found Ohio Helm repositories configuration at ${OHIO_HELM_REPOSITORIES_YAML}"
    fi

    if [[ -n "${HOST_HELM_REPOSITORIES_YAML}" ]] && [[ -n "${OHIO_HELM_REPOSITORIES_YAML}" ]]; then
        echo "Merging Helm repositories with Ohio configuration..."
        sudo mkdir -p "$(dirname "${HELM_REPOSITORIES_YAML}")"
        yq eval-all '. as $repository_config ireduce ({}; . *+ $repository_config)' \
            "${HOST_HELM_REPOSITORIES_YAML}" "${OHIO_HELM_REPOSITORIES_YAML}" \
            | sudo tee "${HELM_REPOSITORIES_YAML}" > /dev/null
    elif [[ -n "${HOST_HELM_REPOSITORIES_YAML}" ]]; then
        sudo cp "${HOST_HELM_REPOSITORIES_YAML}" "${HELM_REPOSITORIES_YAML}"
    else
        echo "Note: No user helm repositories were found in ${HOST_HOME}/.config/helm/repositories.yaml. You will not be able to use helm charts from private registries until this is setup." 1>&2
    fi

    if [[ -e "${HELM_REPOSITORIES_YAML}" ]]; then
        sudo chown ${USERNAME}:${USERNAME} "${HELM_REPOSITORIES_YAML}"
    fi

    # Register repositories referenced by workspace charts that are not yet
    # configured. OCI dependencies are skipped.
    for WORKSPACE in /workspaces/*; do
        if [[ -e "${WORKSPACE}/helm/Chart.yaml" ]]; then
            while IFS= read -r DEPENDENCY; do
                if [[ "${DEPENDENCY}" = "oci://"* ]]; then
                    echo "Skipping OCI dependency ${DEPENDENCY}"
                    continue
                fi

                if ! [[ -e "${HELM_REPOSITORIES_YAML}" ]] || ! (yq -r '.repositories[].url' "${HELM_REPOSITORIES_YAML}" | grep -q '^'"${DEPENDENCY}"'$'); then
                    DEPENDENCY_NAME=$(echo "${DEPENDENCY}" | sed -r 's/https?:\/\/(.*)/\1/' | sed -r 's/[,:\/]/-/g')
                    echo "Adding Helm repository for ${DEPENDENCY_NAME} from current project."
                    helm repo add "${DEPENDENCY_NAME}" "${DEPENDENCY}"
                fi
            done < <(helm dep list "${WORKSPACE}/helm" | grep -v NAME | awk '{ print $3 }')
        fi
    done
fi

# ── code-server (only in the :code-server target) ─────────────────────────────
CS_CONFIG="${USER_HOME}/.config/code-server/config.yaml"
if [[ -e "${CS_CONFIG}" ]]; then
    if [[ -n "${CS_DISABLE_AUTH:-}" ]]; then
        sudo sed -i 's/^auth:.*/auth: none/' "${CS_CONFIG}"
        echo "✓ code-server auth disabled (CS_DISABLE_AUTH set)"
    elif [[ -n "${CODE_SERVER_PASSWORD:-}" ]]; then
        if sudo grep -q "^password:" "${CS_CONFIG}"; then
            sudo sed -i "s|^password:.*|password: ${CODE_SERVER_PASSWORD}|" "${CS_CONFIG}"
        else
            echo "password: ${CODE_SERVER_PASSWORD}" | sudo tee -a "${CS_CONFIG}" > /dev/null
        fi
        echo "✓ code-server password set from CODE_SERVER_PASSWORD"
    fi
fi

# ── Cron: automatic backups ───────────────────────────────────────────────────
echo "Setting up automatic backups..."
mkdir -p /var/log/mosgarage
sudo chown ${USERNAME}:${USERNAME} /var/log/mosgarage
if [[ -n "${BACKUP_DIR:-}" ]]; then
    sudo mkdir -p "${BACKUP_DIR}"
    sudo chown ${USERNAME}:${USERNAME} "${BACKUP_DIR}"
    sudo sed -i "s|^#BACKUP_DIR=.*|BACKUP_DIR=${BACKUP_DIR}|" /etc/cron.d/mosgarage-backup || true
fi
if sudo service cron start 2>/dev/null || sudo cron 2>/dev/null; then
    echo "✓ cron running — backups scheduled via /etc/cron.d/mosgarage-backup"
else
    echo "Warning: could not start cron; run 'sudo service cron start' manually." 1>&2
fi

# ── Backup directory for cron jobs ────────────────────────────────────────────
# Backed by the mosgarage-backups named volume (seeded with mosgarage ownership
# at image build time and mounted at /workspaces/.mosgarage-backups).
if [[ -d /workspaces ]]; then
    sudo mkdir -p /workspaces/.mosgarage-backups
    sudo chown ${USERNAME}:${USERNAME} /workspaces/.mosgarage-backups
fi

run_hooks "image post-configure" "${POST_CONFIG_HOOKS}"
run_hooks "user post-configure" "${HOST_HOME}/.devcontainer/hooks.d/post-start"

if [[ -d "${HOST_HOME:-/nonexistent}" ]]; then
    echo "Note: Your host home directory is available at ${HOST_HOME}"
fi

echo "✓ Container setup done! Please close this window."
