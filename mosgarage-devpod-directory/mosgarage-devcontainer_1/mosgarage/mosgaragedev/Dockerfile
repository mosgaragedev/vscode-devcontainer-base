# ============================================================
# mosgarage/mosgarage — Home Base Docker Image
# Includes: code-server | Node.js 20 LTS | Express API | PM2
# ============================================================

FROM ubuntu:22.04

LABEL maintainer="mosgarage"
LABEL image="docker.io/mosgarage/mosgarage"
LABEL description="mosgarage home base: code-server + node server + API"

# ── Prevent interactive prompts ──────────────────────────────
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# ── Runtime env vars (override at run-time with -e) ──────────
ENV CODE_SERVER_PORT=8080
ENV NODE_SERVER_PORT=3000
ENV API_PORT=4000
ENV CODE_SERVER_PASSWORD=mosgarage
ENV HOME_DIR=/home/mosgarage
ENV APP_DIR=/app
ENV NODE_ENV=production

# ── Base system packages ─────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential \
    python3 \
    python3-pip \
    supervisor \
    openssh-client \
    unzip \
    zip \
    jq \
    htop \
    nano \
    vim \
    net-tools \
    iputils-ping \
    dnsutils \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 LTS ───────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && npm install -g pm2 \
    && npm install -g typescript \
    && npm install -g ts-node \
    && rm -rf /var/lib/apt/lists/*

# ── code-server (VS Code in browser) ─────────────────────────
RUN curl -fsSL https://code-server.dev/install.sh | sh \
    && rm -rf /var/lib/apt/lists/*

# ── Create user & directories ─────────────────────────────────
RUN useradd -m -s /bin/bash mosgarage \
    && mkdir -p ${APP_DIR}/server \
    && mkdir -p ${APP_DIR}/api \
    && mkdir -p ${APP_DIR}/workspace \
    && mkdir -p ${HOME_DIR}/.config/code-server \
    && mkdir -p /var/log/mosgarage

# ── code-server config ────────────────────────────────────────
COPY config/code-server-config.yaml ${HOME_DIR}/.config/code-server/config.yaml

# ── Supervisor config (manages all processes) ─────────────────
COPY config/supervisord.conf /etc/supervisor/conf.d/mosgarage.conf

# ── Node server app ───────────────────────────────────────────
COPY server/package.json     ${APP_DIR}/server/
COPY server/index.js         ${APP_DIR}/server/
COPY server/routes/          ${APP_DIR}/server/routes/

# ── API app ───────────────────────────────────────────────────
COPY api/package.json        ${APP_DIR}/api/
COPY api/index.js            ${APP_DIR}/api/
COPY api/routes/             ${APP_DIR}/api/routes/
COPY api/middleware/         ${APP_DIR}/api/middleware/

# ── PM2 ecosystem ─────────────────────────────────────────────
COPY config/ecosystem.config.js ${APP_DIR}/

# ── Install Node deps ─────────────────────────────────────────
RUN cd ${APP_DIR}/server && npm install --omit=dev \
    && cd ${APP_DIR}/api  && npm install --omit=dev

# ── Startup script ────────────────────────────────────────────
COPY scripts/startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh

# ── Workspace welcome file ────────────────────────────────────
COPY scripts/welcome.md ${APP_DIR}/workspace/WELCOME.md

# ── Fix permissions ───────────────────────────────────────────
RUN chown -R mosgarage:mosgarage ${APP_DIR} ${HOME_DIR} /var/log/mosgarage

# ── Exposed ports ─────────────────────────────────────────────
#   8080 → code-server  (VS Code in browser)
#   3000 → Node server  (home/static/websocket)
#   4000 → Express API  (REST endpoints)
EXPOSE 8080 3000 4000

WORKDIR ${APP_DIR}

CMD ["/usr/local/bin/startup.sh"]
