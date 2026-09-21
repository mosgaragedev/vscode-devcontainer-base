# mosgarage/vscode-devcontainer-base

> A **powerful Ubuntu 24.04 devcontainer base** — one image that works with VS Code,
> Cursor, Claude Code, Gemini CLI, OpenAI Codex, code-server (browser IDE), and WSL2.
> Kubernetes tooling, AI CLIs, automatic cron backups, one-shot bootstrap, and a
> shareable release pipeline included.

[![Build & Push](https://github.com/mosgaragedev/vscode-devcontainer-base/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/mosgaragedev/vscode-devcontainer-base/actions/workflows/docker-publish.yml)
[![Docker Hub](https://img.shields.io/docker/pulls/mosgarage/vscode-devcontainer-base)](https://hub.docker.com/r/mosgarage/vscode-devcontainer-base)

---

## Contents

1. [What's inside](#whats-inside)
2. [Image variants and tags](#image-variants-and-tags)
3. [Branches](#branches)
4. [Quick start](#quick-start)
5. [Associated assets (volumes, mounts, ports, paths, env vars)](#associated-assets)
6. [The `mg` and `mgw` CLIs](#the-mg-and-mgw-clis)
7. [Running and maintaining](#running-and-maintaining)
8. [Automatic backups (cron)](#automatic-backups-cron)
9. [Kubernetes / Helm host configuration](#kubernetes--helm-host-configuration)
10. [Hooks](#hooks)
11. [Building locally](#building-locally)
12. [CI / publishing (GitHub Actions)](#ci--publishing-github-actions)
13. [WSL2](#wsl2)
14. [Security notes](#security-notes)

## What's inside

| Layer        | Tools |
|--------------|-------|
| Base         | Ubuntu 24.04 LTS, zsh + Oh-My-Zsh + Powerlevel10k, passwordless sudo `mosgarage` user |
| Languages    | Python 3.12 (+ venv), Node.js 22 LTS, .NET 10 aspnetcore runtime, build-essential |
| Kubernetes   | kubectl, helm, k9s, kubeseal, skaffold, stern, krew plugins, Mike Farah `yq` |
| AI agents    | Claude Code, Gemini CLI, OpenAI Codex, aider (opt-out: `INSTALL_AI_TOOLS=false`) |
| Productivity | gh CLI, fzf, ripgrep, fd, bat, tmux, jq, shellcheck, tree, htop, cron |
| Remote access | VS Code CLI tunnel (outbound-only, supervised in the `:code-server` target) + sshd :2222 |
| Browser IDE  | **`:code-server` target** — code-server :8080, sshd :2222, supervisor-managed |
| Backups      | Nightly cron job archiving shell/kube/helm/ssh configs with rotation |
| Docker       | Via the [docker-outside-of-docker](https://github.com/devcontainers/features/tree/main/src/docker-outside-of-docker) feature — no socket mounts baked in |

## Image variants and tags

Two build targets ship from one Dockerfile:

| Target        | What it adds | Typical use |
|---------------|--------------|-------------|
| `devcontainer` (default) | Full toolchain only | VS Code / Cursor devcontainers |
| `code-server` | + code-server :8080, sshd :2222, supervisor, cron backups, `mgw` | Browser IDE, remote/headless dev |

Published to both registries on every push to `main`:

```
ghcr.io/mosgaragedev/vscode-devcontainer-base:latest              # devcontainer
ghcr.io/mosgaragedev/vscode-devcontainer-base:code-server         # browser IDE variant
docker.io/mosgarage/vscode-devcontainer-base:latest
docker.io/mosgarage/vscode-devcontainer-base:code-server
```

CI also pushes `:main`, `:devcontainer-YYYYMMDD`, `:vX.Y.Z` (and `:code-server-YYYYMMDD`,
`:vX.Y.Z-code-server`) — see [CI / publishing](#ci--publishing-github-actions).

## Branches

| Branch      | Purpose |
|-------------|---------|
| `main`      | Full workspace: image project + merged `code-server/` stack + `mosgarage-wsl` submodule |
| `release`   | **Sharable version** — only the image project (Dockerfile, scripts, CI, docs). Ideal for sharing or forking |
| `gh-pages`  | Landing page (HTML) deployed via GitHub Pages |

## Quick start

### One-shot bootstrap (auto pull + setup, runs once)

```bash
curl -fsSL https://raw.githubusercontent.com/mosgaragedev/vscode-devcontainer-base/main/scripts/bootstrap.sh | bash
```

The bootstrap script:

1. Clones this repo to `~/.mosgarage/vscode-devcontainer-base` (skipped if already present)
2. Installs the **`mg`** host CLI to `~/.local/bin`
3. Pulls the latest image from Docker Hub
4. Seeds `~/mosgarage-workspace/.devcontainer/devcontainer.json`

Re-runs are idempotent — finished steps are skipped.

### Use in VS Code / Cursor (devcontainer)

Add to your project's `.devcontainer/devcontainer.json`:

```json
{
    "name": "mosgarage devcontainer",
    "image": "ghcr.io/mosgaragedev/vscode-devcontainer-base:latest",
    "features": {
        "ghcr.io/devcontainers/features/docker-outside-of-docker": {}
    },
    "postCreateCommand": "/usr/local/bin/setup-container",
    "postStartCommand": "/usr/local/bin/start-code-tunnel",
    "remoteUser": "mosgarage",
    "remoteEnv": { "HOST_HOME": "${localEnv:HOME}" },
    "mounts": [
        "source=${localEnv:HOME},target=${localEnv:HOME},type=bind,readonly",
        "source=mosgarage-code-tunnel,target=/home/mosgarage/.vscode-cli,type=volume"
    ]
}
```

Then **Reopen in Container** (VS Code) or **Reopen in Dev Container** (Cursor).
A prebuilt config ships in [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json).

### Browser IDE (code-server)

```bash
docker run -d --name mosgarage-ide \
    -p 8080:8080 -p 2222:2222 \
    -e CODE_SERVER_PASSWORD=change-me \
    -v ~/workspace:/home/mosgarage/workspace \
    -v mosgarage-code-tunnel:/home/mosgarage/.vscode-cli \
    -v mosgarage-backups:/workspaces/.mosgarage-backups \
    mosgarage/vscode-devcontainer-base:code-server
# → http://localhost:8080
```

Or with the `mg` CLI: `mg start --ide` → `mg open` (the same volumes are attached
automatically). The IDE container is created with `--restart unless-stopped`, so
it stays up across host reboots (stop it with `mg stop mosgarage-ide`).

### VS Code Remote Tunnel

The image includes the architecture-aware Linux VS Code CLI. In the `:code-server`
target, `code tunnel` runs as a supervised `mosgarage` service and makes no inbound
port available. Authenticate once inside the container — credentials are stored in
the `mosgarage-code-tunnel` volume so you only log in once:

```bash
docker exec -it mosgarage-ide mgw tunnel-login
# The tunnel URL is available with:
docker logs mosgarage-ide 2>&1 | grep -E 'vscode.dev/tunnel|code-tunnel'
```

Check status with `docker exec mosgarage-ide supervisorctl status code-tunnel`
and logs with `mgw logs code-tunnel`. The CLI data is not committed to the repository.

For the regular devcontainer target, the same tunnel is started by
`postStartCommand` using `/usr/local/bin/start-code-tunnel`; run
`code tunnel user login` once in the integrated terminal. The tunnel is
outbound-only and does not require a forwarded port.

---

## Associated assets

Everything the containers create, mount, or expose on your machine — one reference.

### Named Docker volumes

| Volume | Container path | What it holds | Created by |
|--------|----------------|---------------|------------|
| `mosgarage-home` | `/home/mosgarage/.vscode-server` | VS Code server binaries + extensions for devcontainer sessions | `mg start` (first run) |
| `mosgarage-code-tunnel` | `/home/mosgarage/.vscode-cli` | VS Code CLI + Remote Tunnel credentials (`code tunnel user login`) | `mg start --ide` and the devcontainer config |
| `mosgarage-backups` | `/workspaces/.mosgarage-backups` | Nightly config backup archives — survives container removal | `mg start` / `mg start --ide` and the devcontainer config |

List / inspect / remove them:

```bash
docker volume ls | grep mosgarage-
docker volume inspect mosgarage-code-tunnel
docker volume rm mosgarage-home        # deletes VS Code server state (extensions re-download)
docker volume rm mosgarage-backups     # deletes all backup archives — export first!
```

> Removing `mosgarage-code-tunnel` logs you out of the tunnel — re-run
> `mgw tunnel-login` afterwards. Removing `mosgarage-backups` is destructive:
> copy the archives out first (`docker run --rm -v mosgarage-backups:/b -v "$PWD":/h alpine cp -a /b/. /h/`).

### Bind mounts

| Host path | Container path | Mode | Purpose |
|-----------|----------------|------|---------|
| `$PWD` (or `MOSGARAGE_PROJECT_DIR`) | `/workspaces/<project-name>` | rw | Your project — the actual workspace |
| `$HOME` (or `MOSGARAGE_HOST_HOME`) | same path inside | **read-only** | Host credentials pickup: `.kube/config`, `.config/helm/repositories.yaml`, `.ssh`, shell dotfiles |

The read-only home mount is deliberate — the container can read your credentials
but never write to your host home. Remove it from the devcontainer config if you
don't want that.

### Ports

| Port | Service | Notes |
|------|---------|-------|
| 8080 | code-server HTTP | Browser IDE (`:code-server` target), password auth |
| 2222 | sshd | Key-only auth (`PasswordAuthentication no`), user `mosgarage` |
| 3000 / 4000 | — | Exposed for dev servers you run inside the workspace |
| 7072 | mosgarage agent | Only used when the control plane injects the agent binary |

Override the published ports per run:
`MOSGARAGE_IDE_HTTP_PORT=8081 MOSGARAGE_IDE_SSH_PORT=2223 make auto-ide`.

### In-container paths

| Path | Purpose |
|------|---------|
| `/home/mosgarage/workspace` | Default workspace folder for the browser IDE |
| `/workspaces/<project-name>` | Your mounted project (devcontainer mode) |
| `/home/mosgarage/.config/code-server/config.yaml` | code-server config (bind-addr, auth, password) |
| `/home/mosgarage/.local/share/code-server` | code-server user data + extensions |
| `/var/log/mosgarage/` | All service logs (startup, code-server, sshd, cron, tunnel, backups) |
| `/etc/cron.d/mosgarage-backup` | Nightly backup schedule |
| `/etc/supervisor/conf.d/workspace.conf` | Supervisor service definitions (`:code-server` target) |
| `/usr/local/lib/devcontainer/hooks.d/{pre-start,post-start}` | Image-baked hooks |
| `${HOST_HOME}/.devcontainer/hooks.d/{pre-start,post-start}` | Your per-user hooks |
| `/workspaces/.mosgarage-backups` | Backup archives (mounted from the `mosgarage-backups` volume; fallback: `~/backups/mosgarage`) |
| `/usr/local/bin/{setup-container,backup-workspace,mgw,debug-webserver}` | Runtime scripts |

### Environment variables

**Runtime (container):**

| Variable | Default | Purpose |
|----------|---------|---------|
| `HOST_HOME` | *(unset)* | Host home mount path; enables kube/helm/ssh pickup + hooks. Warns loudly when missing |
| `CODE_SERVER_PASSWORD` | *(token in log)* | code-server web password |
| `CS_DISABLE_AUTH` | *(unset)* | Set to disable code-server auth entirely (⚠ only for private networks) |
| `SSH_AUTHORIZED_KEYS` | *(unset)* | Inject SSH public keys into `authorized_keys` at startup |
| `GITHUB_USER` | *(unset)* | Fetch that GitHub user's public keys for SSH at startup |
| `GIT_NAME` / `GIT_EMAIL` | *(unset)* | Configure git identity at startup |
| `BACKUP_DIR` | `/workspaces/.mosgarage-backups` | Backup destination (see [persistence notes](#what-persists-and-what-doesnt)) |
| `BACKUP_KEEP` | `7` | Number of backup archives to keep |
| `BACKUP_EXTRA_SOURCES` | *(empty)* | Extra `$HOME` paths to include in backups (space-separated) |
| `MOSGARAGE_BACKUP_CRON` | `0 2 * * *` | Override the backup schedule (edit the cron file) |
| `VSCODE_CLI_DATA_DIR` | `/home/mosgarage/.vscode-cli` | VS Code CLI data dir (tunnel credentials) |
| `MOSGARAGE_MODE` | *(unset)* | `code-server` starts the supervised IDE stack in the entrypoint |

**Host CLI (`mg`) overrides:**

| Variable | Default |
|----------|---------|
| `MOSGARAGE_IMAGE` | `mosgarage/vscode-devcontainer-base:latest` |
| `MOSGARAGE_IDE_IMAGE` | `mosgarage/vscode-devcontainer-base:code-server` |
| `MOSGARAGE_CONTAINER` | `mosgarage-dev` |
| `MOSGARAGE_IDE_CONTAINER` | `mosgarage-ide` |
| `MOSGARAGE_PROJECT_DIR` | `$PWD` |
| `MOSGARAGE_HOST_HOME` | `$HOME` |
| `MOSGARAGE_IDE_PASSWORD` | `mosgarage` |
| `MOSGARAGE_IDE_HTTP_PORT` / `MOSGARAGE_IDE_SSH_PORT` | `8080` / `2222` |

**Build args (Dockerfile):**

| Arg | Default | Purpose |
|-----|---------|---------|
| `INSTALL_AI_TOOLS` | `true` | Set `false` to skip Claude Code / Gemini / Codex |
| `NODE_VERSION` / `DOTNET_CHANNEL` | `22` / `10.0` | Language versions |
| `CODE_SERVER_VERSION` | `latest` | Pin code-server (`--build-arg CODE_SERVER_VERSION=4.92.2`) |
| `SKAFFOLD_VERSION`, `KUBECTL_VERSION`, `HELM_VERSION`, `KUBESEAL_VERSION`, `K9S_VERSION`, `STERN_VERSION`, `YQ_VERSION` | see Dockerfile | Pin CLI tool versions |
| `USERNAME` / `USER_UID` / `USER_GID` | `mosgarage` / `1001` / `1001` | Container user |

---

## The `mg` and `mgw` CLIs

**`mg`** runs on your **host** and manages containers (installed by the bootstrap script):

```
mg start [--ide]    Start the devcontainer (or browser IDE variant)
mg stop [name]      Remove the container
mg status           List mosgarage containers
mg exec CMD         Run a command inside the container
mg backup           Trigger a config backup now
mg update           Backup + pull the latest images
mg open             Open the IDE in your browser
mg tunnel-login     Authenticate the VS Code tunnel in the IDE container
```

**`mgw`** runs **inside** the container (preinstalled in the `:code-server` target):

```
mgw start|stop|restart    Manage services (code-server, sshd, cron, code-tunnel)
mgw status                Runtime + version summary
mgw logs [service]        Tail service logs
mgw password <pw>         Change the code-server password
mgw keys <github-user>    Import GitHub SSH public keys
mgw backup [label]        Run a backup now
mgw open                  Open the IDE (WSL-aware)
```

Supervised services in the `:code-server` target: `code-server`, `code-tunnel`,
`sshd`, `cron`, `mosgarage-agent` (the agent only runs when injected by the
control plane; it sleeps otherwise).

---

## Running and maintaining

### Day-to-day

```bash
make dev          # interactive devcontainer for the current project
make ide          # browser IDE detached on :8080 (password: mosgarage)
make shell        # zsh into the running IDE container
make logs         # follow IDE container logs
make status       # list mosgarage containers
make stop         # remove the IDE container
```

### What persists and what doesn't

| Data | Survives `docker rm` / re-create? | Where |
|------|-----------------------------------|-------|
| Your project files | ✅ | Host bind mount (`/workspaces/<project>`) |
| VS Code server + extensions (devcontainer) | ✅ | `mosgarage-home` volume |
| Tunnel login | ✅ | `mosgarage-code-tunnel` volume |
| Backup archives | ✅ | `mosgarage-backups` volume |
| code-server settings, extensions, `~/.ssh`, `~/.gitconfig` | ❌ | Container layer |

> The backup directory is backed by the `mosgarage-backups` **named volume by
> default**, so archives survive container removal and image updates. To keep
> backups on the host instead, override `BACKUP_DIR` (e.g.
> `BACKUP_DIR=/workspaces/<project>/.mosgarage-backups` in `remoteEnv`) or mount
> a host directory at `/workspaces/.mosgarage-backups`. Note that named volumes
> are still removed by `docker volume rm` and `docker system prune --volumes` —
> copy archives off-box for anything you can't afford to lose.

### Updating the image

```bash
mg update                 # runs a backup, then pulls both latest images
mg stop mosgarage-ide     # or: make stop
mg start --ide            # recreate from the new image
```

`mgw update` (inside the container) prints this same runbook. Recommended order:
`mgw backup pre-update` **first**, so a fresh archive exists before recreating.
Workspace data lives in mounts/volumes and is **not** deleted by image updates.

### Backups and restore

- Manual backup: `mg backup` (host) or `mgw backup my-label` (inside).
- Archives: `mosgarage-backup-<hostname>-<timestamp>.tar.gz`, mode `600`,
  containing `.kube`, `.config/helm`, `.ssh`, zsh/p10k configs, `.gitconfig`
  (plus `BACKUP_EXTRA_SOURCES`).
- Restore inside a (re)created container:

```bash
tar -xzf /workspaces/.mosgarage-backups/mosgarage-backup-<...>.tar.gz -C /home/mosgarage
```

### Logs and troubleshooting

| What | Where |
|------|-------|
| Container startup log | `docker logs mosgarage-ide` (also `/var/log/mosgarage/startup.log`) |
| Per-service logs | `mgw logs code-server` / `sshd` / `cron` / `code-tunnel` |
| Backup log | `/var/log/mosgarage/backup.log` |
| Service status | `mgw status` or `supervisorctl status` (inside) |
| Setup warnings (kube/helm not found) | `docker logs` at container start — `setup-container` prints them |
| Debug web server | `/usr/local/bin/debug-webserver` (small Flask app for probing the container) |

### Rebuilding locally

```bash
make build        # devcontainer target (local only, no push)
make build-ide    # code-server target
make auto         # build both targets + (re)start the browser IDE stack
```

`make auto` is the one-command rebuild-and-run: it rebuilds the local image(s)
and recreates the IDE container (password via `PASSWORD=`; default `mosgarage`).
Re-running it is idempotent — `setup-container.sh` refreshes config (hooks,
kubeconfig, Helm repos, backups) on every start.

> After changing the Dockerfile, installed packages, entrypoint behavior, or
> tooling versions, **rebuild your devcontainer** in VS Code
> (**Dev Containers: Rebuild Container**) to test the changes.

Builds use `--network host` so the container build can reach package repos when
the host resolver is a loopback stub (e.g. systemd-resolved).
`skaffold build -p local` (config: `config/skaffold.yaml`) also works for the
devcontainer target — **always add `--push=false`** when testing so you don't
overwrite `:latest`.

### Cleaning up

```bash
make stop                                  # remove the IDE container
bash scripts/mg stop mosgarage-dev         # remove the dev container
docker volume rm mosgarage-home mosgarage-code-tunnel mosgarage-backups   # drop state
docker image rm mosgarage/vscode-devcontainer-base:latest \
                mosgarage/vscode-devcontainer-base:code-server           # drop images
```

---

## Automatic backups (cron)

The image ships with `/etc/cron.d/mosgarage-backup` running nightly at 02:00 via
`/usr/local/bin/backup-workspace`. It archives `.kube`, `.config/helm`, `.ssh`,
zsh/p10k configs, and `.gitconfig` from `/home/mosgarage`, keeping the last 7
archives in `/workspaces/.mosgarage-backups` — a named volume (`mosgarage-backups`)
that survives container removal by default (fallback `~/backups/mosgarage`).

| Env var               | Default                          | Purpose |
|-----------------------|----------------------------------|---------|
| `BACKUP_DIR`          | `/workspaces/.mosgarage-backups` | Where archives go (settable in `remoteEnv` or the cron file) |
| `BACKUP_KEEP`         | `7`                              | Archives to retain |
| `BACKUP_EXTRA_SOURCES`| *(empty)*                        | Extra paths in `$HOME` to include |
| `MOSGARAGE_BACKUP_CRON` | `0 2 * * *`                    | Override the schedule (edit the cron file) |

Run one manually: `sudo -u mosgarage backup-workspace` or `mgw backup`.

## Kubernetes / Helm host configuration

On startup, `setup-container.sh` copies `${HOST_HOME}/.kube/config` and picks Helm
repositories from `${HOST_HOME}/.config/helm/repositories.yaml` (or the macOS
`Library/Preferences/helm` path). An optional sibling **`repositories-ohio.yaml`**
is merged in using `yq eval-all '. as $rc ireduce ({}; . *+ $rc)'`. Chart-derived
repositories are only added when neither their URL nor name is already configured;
OCI dependencies are skipped.

## Hooks

`setup-container.sh` runs pre/post-start hooks from:

```
/usr/local/lib/devcontainer/hooks.d/pre-start     # baked into the image
/usr/local/lib/devcontainer/hooks.d/post-start
${HOST_HOME}/.devcontainer/hooks.d/pre-start      # per-user, on your host
${HOST_HOME}/.devcontainer/hooks.d/post-start
```

## CI / publishing (GitHub Actions)

[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml) builds
**both targets** (multi-arch amd64+arm64) and pushes to GHCR + Docker Hub on pushes to
`main`, the `release` branch, and version tags (`v*`). Smoke tests run on tags.

**One-time setup — add these repo secrets** (Settings → Secrets and variables → Actions):

- `DOCKERHUB_USERNAME` — your Docker Hub username (`mosgarage`)
- `DOCKERHUB_TOKEN` — a Docker Hub access token

GHCR publishing works out of the box via `GITHUB_TOKEN`.

## WSL2

Two complementary stacks live in this repo:

- **`mosgarage-wsl`** (git submodule → [mosgarage/mosgarage-wsl](https://github.com/mosgarage/mosgarage-wsl)):
  the host-side WSL2 maintenance stack — `mgw install`, auto-updates, auto-backups, distro export.
  Use `make wsl-install`, `make wsl-enter`, `make wsl-backup`. Its `mgw` remains separate
  from the container `mgw` because the two CLIs manage different runtimes.
- **`code-server/`**: the standalone code-server stack with `wsl-pack.sh` /
  `wsl-import.ps1` / `wsl-export.ps1` for turning any image variant into a WSL2 distro.

## Security notes

- The `mosgarage` user has **passwordless sudo** inside the container — treat the
  container as root-equivalent.
- Mounting your home directory read-only is deliberate; remove it if you don't need
  host credentials.
- SSH on :2222 accepts **public keys only** — inject keys with `SSH_AUTHORIZED_KEYS`,
  `GITHUB_USER`, or `mgw keys <github-user>`.
- The VS Code tunnel is outbound-only; no inbound ports are opened for it.
- ⚠️ A GitHub token was previously committed in `code-server/.env` / `.env.sample`.
  It has been scrubbed from this repo — **revoke it** on GitHub if you haven't.

## License

MIT — see [LICENSE](LICENSE).
