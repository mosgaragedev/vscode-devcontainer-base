# ╔══════════════════════════════════════════════════════════════════╗
# ║  mosgarage/code-server · Dockerfile                              ║
# ║                                                                  ║
# ║  Variants (--target):                                            ║
# ║    base    Ubuntu 22.04 + code-server + Node 20 + .NET runtime   ║
# ║    sdk     base + .NET 8 SDK (for local dev / CI)                ║
# ║    python  base + Python 3.12 + uv                               ║
# ║    full    base + SDK + Python (everything)                      ║
# ║                                                                  ║
# ║  :base + :latest  →  docker.io/mosgarage/code-server             ║
# ║  :full            →  docker.io/mosgarage/workspace               ║
# ║                                                                  ║
# ║  WSL distro: make wsl-pack TARGET=full                           ║
# ╚══════════════════════════════════════════════════════════════════╝

ARG UBUNTU_VERSION=22.04
ARG NODE_VERSION=20
ARG DOTNET_CHANNEL=8.0

# ── base ──────────────────────────────────────────────────────────────────────
# Mirrors the workspace-base stage from mosgarage/mosgarage Dockerfile
# so mosgarage/code-server:latest and mosgarage/workspace:latest stay in sync.
FROM ubuntu:${UBUNTU_VERSION} AS base

ARG NODE_VERSION
ARG DOTNET_CHANNEL

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8 \
    DOTNET_ROOT=/usr/local/dotnet \
    PATH="$PATH:/usr/local/dotnet"

LABEL org.opencontainers.image.title="mosgarage/code-server"
LABEL org.opencontainers.image.description="mosgarage managed workspace — code-server + Node + .NET runtime"
LABEL org.opencontainers.image.source="https://github.com/mosgarage/code-server"
LABEL org.opencontainers.image.vendor="mosgarage"

# ── System packages (exact match to workspace-base) ───────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    openssh-client \
    openssh-server \
    ca-certificates \
    build-essential \
    python3 \
    python3-pip \
    unzip \
    zip \
    jq \
    vim \
    nano \
    htop \
    supervisor \
    inotify-tools \
    net-tools \
    locales \
    sudo \
    && locale-gen en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 LTS ────────────────────────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest pm2 \
    && rm -rf /var/lib/apt/lists/*

# ── code-server ───────────────────────────────────────────────────────────────
RUN curl -fsSL https://code-server.dev/install.sh | sh \
    && rm -rf /tmp/code-server*

# ── .NET aspnetcore runtime (mirrors workspace-base, no SDK overhead) ─────────
RUN curl -fsSL https://dot.net/v1/dotnet-install.sh \
    | bash -s -- --runtime aspnetcore --channel ${DOTNET_CHANNEL} \
                 --install-dir /usr/local/dotnet \
    && /usr/local/dotnet/dotnet --info

# ── mosgarage user ────────────────────────────────────────────────────────────
RUN useradd -m -s /bin/bash -d /home/mosgarage mosgarage \
    && echo "mosgarage ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/mosgarage \
    && chmod 0440 /etc/sudoers.d/mosgarage

# ── Workspace directory structure ─────────────────────────────────────────────
RUN mkdir -p \
    /home/mosgarage/.config/code-server \
    /home/mosgarage/.ssh \
    /home/mosgarage/workspace \
    /home/mosgarage/web \
    /app/agent \
    /var/log/mosgarage \
    && chown -R mosgarage:mosgarage /home/mosgarage /var/log/mosgarage

# ── SSH hardening ─────────────────────────────────────────────────────────────
RUN mkdir -p /run/sshd && ssh-keygen -A \
    && sed -i \
        -e 's/#PasswordAuthentication yes/PasswordAuthentication no/' \
        -e 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' \
        /etc/ssh/sshd_config \
    && echo "AllowUsers mosgarage" >> /etc/ssh/sshd_config \
    && echo "Port 2222" >> /etc/ssh/sshd_config

# ── Configs ───────────────────────────────────────────────────────────────────
COPY workspace-supervisord.conf /etc/supervisor/conf.d/workspace.conf
COPY code-server.yaml           /home/mosgarage/.config/code-server/config.yaml
COPY wsl.conf                   /etc/wsl.conf

# ── Scripts ───────────────────────────────────────────────────────────────────
COPY workspace-startup.sh /usr/local/bin/workspace-start
COPY mgw                  /usr/local/bin/mgw
RUN chmod +x /usr/local/bin/workspace-start /usr/local/bin/mgw

# ── Web landing page ──────────────────────────────────────────────────────────
RUN mkdir -p /home/mosgarage/web
COPY index.html /home/mosgarage/web/index.html

# ── Ownership ─────────────────────────────────────────────────────────────────
RUN chown -R mosgarage:mosgarage \
    /home/mosgarage/.config \
    /home/mosgarage/web

# ── Ports ─────────────────────────────────────────────────────────────────────
# 8080 → code-server (VS Code browser IDE)
# 3000 → user app dev port
# 4000 → user app dev port
# 7072 → workspace agent (mosgarage protocol)
# 2222 → SSH
EXPOSE 8080 3000 4000 7072 2222

USER mosgarage
WORKDIR /home/mosgarage/workspace
CMD ["/usr/local/bin/workspace-start"]


# ── sdk ───────────────────────────────────────────────────────────────────────
# base + full .NET 8 SDK (replaces aspnetcore-only runtime)
FROM base AS sdk

USER root

ARG DOTNET_CHANNEL=8.0

RUN curl -fsSL https://dot.net/v1/dotnet-install.sh \
    | bash -s -- --channel ${DOTNET_CHANNEL} \
                 --install-dir /usr/local/dotnet \
    && /usr/local/dotnet/dotnet --version

ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_NOLOGO=1 \
    NUGET_XMLDOC_MODE=skip

USER mosgarage


# ── python ────────────────────────────────────────────────────────────────────
# base + Python 3.12 venv + uv
FROM base AS python

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-venv \
    python3.12-dev \
    && update-alternatives --install /usr/bin/python  python  /usr/bin/python3.12 1 \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1 \
    && pip install --no-cache-dir uv \
    && rm -rf /var/lib/apt/lists/*

USER mosgarage


# ── full ──────────────────────────────────────────────────────────────────────
# .NET SDK + Python 3.12 + uv — the "grades" top-level distro
FROM sdk AS full

USER root

ARG DOTNET_CHANNEL=8.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-venv \
    python3.12-dev \
    && update-alternatives --install /usr/bin/python  python  /usr/bin/python3.12 1 \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1 \
    && pip install --no-cache-dir uv \
    && rm -rf /var/lib/apt/lists/*

USER mosgarage
