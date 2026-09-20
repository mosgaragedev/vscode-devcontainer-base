# ╔══════════════════════════════════════════════════════════════════╗
# ║  mosgarage/vscode-devcontainer-base · Dockerfile                 ║
# ║                                                                  ║
# ║  Targets (--target):                                             ║
# ║    devcontainer  Ubuntu 24.04 + full dev toolchain (default)     ║
# ║    code-server   devcontainer + code-server IDE + sshd + cron    ║
# ║                                                                  ║
# ║  Registries:                                                     ║
# ║    ghcr.io/mosgaragedev/vscode-devcontainer-base                  ║
# ║    docker.io/mosgarage/vscode-devcontainer-base                   ║
# ║                                                                  ║
# ║  Works with VS Code, Cursor, Claude Code, and any devcontainer-  ║
# ║  compatible editor. The :code-server target additionally runs a  ║
# ║  browser IDE on port 8080 (supervisor-managed).                  ║
# ╚══════════════════════════════════════════════════════════════════╝

ARG UBUNTU_VERSION=24.04

# ── devcontainer ──────────────────────────────────────────────────────────────
FROM ubuntu:${UBUNTU_VERSION} AS devcontainer

ARG USERNAME=mosgarage
ARG USER_UID=1001
ARG USER_GID=1001
ARG LANG=en_US.UTF-8
ARG LANGUAGE=en_US.UTF-8
ARG LC_ALL=en_US.UTF-8
ARG TZ=America/New_York

# Toolchain knobs
ARG NODE_VERSION=22
ARG DOTNET_CHANNEL=10.0
ARG INSTALL_AI_TOOLS=true

# CLI tool versions
ARG SKAFFOLD_VERSION=2.14.2
ARG KUBECTL_VERSION=1.31.4
ARG HELM_VERSION=3.16.4
ARG KUBESEAL_VERSION=0.27.3
ARG K9S_VERSION=0.32.7
ARG STERN_VERSION=1.31.0
ARG YQ_VERSION=4.44.3

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=${LANG} \
    LANGUAGE=${LANGUAGE} \
    LC_ALL=${LC_ALL} \
    TZ=${TZ} \
    DOTNET_ROOT=/usr/local/dotnet \
    PATH=/usr/local/dotnet:${PATH} \
    KREW_ROOT=/home/${USERNAME}/.krew

LABEL org.opencontainers.image.title="mosgarage/vscode-devcontainer-base"
LABEL org.opencontainers.image.description="Powerful Ubuntu 24.04 devcontainer base: k8s stack, AI CLIs, code-server variant, cron backups"
LABEL org.opencontainers.image.source="https://github.com/mosgaragedev/vscode-devcontainer-base"
LABEL org.opencontainers.image.vendor="mosgarage"
LABEL org.opencontainers.image.licenses="MIT"

# ── System packages ───────────────────────────────────────────────────────────
RUN apt-get update && \
    apt-get -y dist-upgrade && \
    apt-get -y install --no-install-recommends \
    bash-completion \
    bat \
    build-essential \
    ca-certificates \
    cron \
    curl \
    dnsutils \
    fd-find \
    file \
    fzf \
    gnupg \
    git \
    htop \
    iproute2 \
    iputils-ping \
    jq \
    less \
    locales \
    lsb-release \
    man-db \
    nano \
    net-tools \
    netcat-openbsd \
    openssh-client \
    pkg-config \
    procps \
    python3 \
    python3-pip \
    python3-venv \
    ripgrep \
    rsync \
    shellcheck \
    software-properties-common \
    sqlite3 \
    sudo \
    tmux \
    tree \
    tzdata \
    unzip \
    vim \
    wget \
    zip \
    zsh && \
    sed -i "/${LANG}/s/^# //g" /etc/locale.gen && \
    locale-gen && \
    apt-get autoremove --purge -y && \
    rm -rf /var/lib/apt/lists/*

# ── Node.js LTS (needed by AI CLIs and JS dev) ────────────────────────────────
RUN curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g npm@latest && \
    rm -rf /var/lib/apt/lists/*

# ── GitHub CLI ────────────────────────────────────────────────────────────────
RUN install -d -m 0755 /etc/apt/keyrings && \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        -o /etc/apt/keyrings/githubcli-archive-keyring.gpg && \
    chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
        > /etc/apt/sources.list.d/github-cli.list && \
    apt-get update && apt-get install -y --no-install-recommends gh && \
    rm -rf /var/lib/apt/lists/*

# ── AI coding agent CLIs (opt out with INSTALL_AI_TOOLS=false) ────────────────
RUN if [ "${INSTALL_AI_TOOLS}" = "true" ]; then \
        npm install -g --no-audit --no-fund \
            @anthropic-ai/claude-code \
            @google/gemini-cli \
            @openai/codex; \
    fi

# ── .NET aspnetcore runtime (parity with the code-server workspace stack) ─────
RUN curl -fsSL https://dot.net/v1/dotnet-install.sh \
        | bash -s -- --runtime aspnetcore --channel ${DOTNET_CHANNEL} \
                     --install-dir /usr/local/dotnet && \
    /usr/local/dotnet/dotnet --info

# ── mosgarage user (passwordless sudo, zsh) ───────────────────────────────────
RUN groupadd -g ${USER_GID} ${USERNAME} && \
    useradd -s /bin/zsh -m -d /home/${USERNAME} -u ${USER_UID} -g ${USER_GID} ${USERNAME} && \
    mkdir -p /etc/sudoers.d && \
    echo "${USERNAME} ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/${USERNAME} && \
    chmod 0440 /etc/sudoers.d/${USERNAME}

# ── System-wide CLI tools (kubectl, helm, k9s, kubeseal, skaffold, yq, stern) ─
COPY install-system-dependencies.sh /usr/local/bin/install-system-dependencies
RUN chmod +x /usr/local/bin/install-system-dependencies && \
    /usr/local/bin/install-system-dependencies

COPY adp-connect.sh /usr/local/bin/adp-connect
COPY install-user-dependencies.sh /usr/local/bin/install-user-dependencies
RUN chmod +x /usr/local/bin/install-user-dependencies \
    /usr/local/bin/adp-connect

USER ${USERNAME}

RUN /usr/local/bin/install-user-dependencies

# ── Shell experience ──────────────────────────────────────────────────────────
COPY --chown=${USER_UID}:${USER_GID} config/zshrc.zsh        /home/${USERNAME}/.zshrc
COPY --chown=${USER_UID}:${USER_GID} config/zsh-aliases.zsh  /home/${USERNAME}/.zsh-aliases.zsh
COPY --chown=${USER_UID}:${USER_GID} config/p10k.zsh         /home/${USERNAME}/.p10k.zsh
COPY --chown=${USER_UID}:${USER_GID} config/bindkeys.zsh     /home/${USERNAME}/.bindkeys.zsh

# ── Runtime scripts, cron backup, and debug tooling ───────────────────────────
USER 0

COPY docker-entrypoint.sh  /usr/local/bin/docker-entrypoint
COPY wait-for-death.sh     /usr/local/bin/wait-for-death
COPY setup-container.sh    /usr/local/bin/setup-container
COPY debug-webserver.py    /usr/local/bin/debug-webserver
COPY scripts/backup-workspace.sh /usr/local/bin/backup-workspace
COPY scripts/start-code-tunnel.sh /usr/local/bin/start-code-tunnel

RUN chmod u+rwx,g+rx,o+rx \
    /usr/local/bin/setup-container \
    /usr/local/bin/docker-entrypoint \
    /usr/local/bin/wait-for-death \
    /usr/local/bin/debug-webserver \
    /usr/local/bin/backup-workspace \
    /usr/local/bin/start-code-tunnel

# ── Cron: automatic workspace/config backups ──────────────────────────────────
COPY config/cron/mosgarage-backup /etc/cron.d/mosgarage-backup
RUN chmod 0644 /etc/cron.d/mosgarage-backup && \
    mkdir -p /var/log/mosgarage && \
    chown ${USER_UID}:${USER_GID} /var/log/mosgarage

# ── Devcontainer hooks ────────────────────────────────────────────────────────
RUN mkdir -p /home/${USERNAME}/.docker /home/${USERNAME}/.kube && \
    chown ${USER_UID}:${USER_GID} /home/${USERNAME}/.docker /home/${USERNAME}/.kube && \
    mkdir -p /usr/local/lib/devcontainer/hooks.d/pre-start && \
    mkdir -p /usr/local/lib/devcontainer/hooks.d/post-start

ENTRYPOINT ["/usr/local/bin/docker-entrypoint"]

# ── code-server ───────────────────────────────────────────────────────────────
# Adds the browser IDE (merged from the mosgarage/code-server stack):
#   code-server :8080, sshd :2222, agent :7072 (if injected), cron backups.
FROM devcontainer AS code-server

ARG CODE_SERVER_VERSION=latest
ARG USERNAME=mosgarage

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends supervisor openssh-server && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /run/sshd && ssh-keygen -A && \
    sed -i \
        -e 's/#PasswordAuthentication yes/PasswordAuthentication no/' \
        -e 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' \
        /etc/ssh/sshd_config && \
    echo "AllowUsers ${USERNAME}" >> /etc/ssh/sshd_config && \
    echo "Port 2222" >> /etc/ssh/sshd_config

RUN if [ "${CODE_SERVER_VERSION}" = "latest" ]; then \
        curl -fsSL https://code-server.dev/install.sh | sh; \
    else \
        curl -fsSL https://code-server.dev/install.sh | sh -s -- --version "${CODE_SERVER_VERSION}"; \
    fi && \
    rm -rf /tmp/code-server*

COPY config/workspace-supervisord.conf /etc/supervisor/conf.d/workspace.conf
COPY mgw /usr/local/bin/mgw
COPY scripts/workspace-startup.sh /usr/local/bin/workspace-start

RUN chmod +x /usr/local/bin/mgw /usr/local/bin/workspace-start && \
    mkdir -p /home/${USERNAME}/.config/code-server /home/${USERNAME}/workspace && \
    chown -R 1001:1001 /home/${USERNAME}/.config /home/${USERNAME}/workspace && \
    printf 'bind-addr: 0.0.0.0:8080\nauth: password\ncert: false\nuser-data-dir: /home/%s/.local/share/code-server\nextensions-dir: /home/%s/.local/share/code-server/extensions\n' \
        "${USERNAME}" "${USERNAME}" \
        > /home/${USERNAME}/.config/code-server/config.yaml && \
    chown 1001:1001 /home/${USERNAME}/.config/code-server/config.yaml

ENV MOSGARAGE_MODE=code-server

EXPOSE 8080 3000 4000 7072 2222

CMD ["/usr/local/bin/workspace-start"]
