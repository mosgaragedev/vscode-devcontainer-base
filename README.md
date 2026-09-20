# mosgarage/vscode-devcontainer-base

> A **powerful Ubuntu 24.04 devcontainer base** — one image that works with VS Code,
> Cursor, Claude Code, Gemini CLI, OpenAI Codex, code-server (browser IDE), and WSL2.
> Kubernetes tooling, AI CLIs, automatic cron backups, one-shot bootstrap, and a
> shareable release pipeline included.

[![Build & Push](https://github.com/mosgaragedev/vscode-devcontainer-base/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/mosgaragedev/vscode-devcontainer-base/actions/workflows/docker-publish.yml)
[![Docker Hub](https://img.shields.io/docker/pulls/mosgarage/vscode-devcontainer-base)](https://hub.docker.com/r/mosgarage/vscode-devcontainer-base)

---

## What's inside

| Layer        | Tools |
|--------------|-------|
| Base         | Ubuntu 24.04 LTS, zsh + Oh-My-Zsh + Powerlevel10k, passwordless sudo `mosgarage` user |
| Languages    | Python 3.12 (+ venv), Node.js 22 LTS, .NET 10 aspnetcore runtime, build-essential |
| Kubernetes   | kubectl, helm, k9s, kubeseal, skaffold, stern, krew plugins, Mike Farah `yq` |
| AI agents    | Claude Code, Gemini CLI, OpenAI Codex, aider (opt-out: `INSTALL_AI_TOOLS=false`) |
| Productivity | gh CLI, fzf, ripgrep, fd, bat, tmux, jq, shellcheck, tree, htop, cron |
| Remote access | VS Code CLI tunnel in the `:code-server` target; supervised, outbound-only, authenticated interactively |
| Browser IDE  | **`:code-server` target** — code-server :8080, sshd :2222, supervisor-managed |
| Backups      | Nightly cron job archiving shell/kube/helm/ssh configs with rotation |
| Docker       | Via the [docker-outside-of-docker](https://github.com/devcontainers/features/tree/main/src/docker-outside-of-docker) feature — no socket mounts baked in |

## Branches

| Branch      | Purpose |
|-------------|---------|
| `main`      | Full workspace: image project + merged `code-server/` stack + `mosgarage-wsl` submodule |
| `release`   | **Sharable version** — only the image project (Dockerfile, scripts, CI, docs). Ideal for sharing or forking |
| `gh-pages`  | Landing page (HTML) deployed via GitHub Pages |

Images are published to both registries on every push to `main`:

```
ghcr.io/mosgaragedev/vscode-devcontainer-base:latest        # devcontainer
ghcr.io/mosgaragedev/vscode-devcontainer-base:code-server   # browser IDE variant
docker.io/mosgarage/vscode-devcontainer-base:latest
docker.io/mosgarage/vscode-devcontainer-base:code-server
```

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
    "remoteUser": "mosgarage",
    "remoteEnv": { "HOST_HOME": "${localEnv:HOME}" },
    "mounts": [
        "source=${localEnv:HOME},target=${localEnv:HOME},type=bind,readonly"
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
    mosgarage/vscode-devcontainer-base:code-server
# → http://localhost:8080
```

Or with the `mg` CLI: `mg start --ide` → `mg open`.

### VS Code Remote Tunnel

The image includes the architecture-aware Linux VS Code CLI. In the `:code-server` target,
`code tunnel` runs as a supervised `mosgarage` service and makes no inbound port
available. Authenticate once inside the container, using the persisted tunnel volume:

```bash
docker exec -it mosgarage-ide mgw tunnel-login
# The tunnel URL is available with:
docker logs mosgarage-ide 2>&1 | grep -E 'vscode.dev/tunnel|code-tunnel'
```

The CLI data is stored in the `mosgarage-code-tunnel` volume and is not committed to
the repository. Check status with `docker exec mosgarage-ide supervisorctl status code-tunnel`
and logs with `mgw logs code-tunnel`.

For the regular devcontainer target, the same tunnel is started by
`postStartCommand` using `/usr/local/bin/start-code-tunnel`; run
`code tunnel user login` once in the integrated terminal. The tunnel is outbound-only
and does not require a forwarded port.

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
mgw start|stop|restart    Manage services (code-server, sshd, cron)
mgw status                Runtime + version summary
mgw logs [service]        Tail service logs
mgw password <pw>         Change the code-server password
mgw keys <github-user>    Import GitHub SSH public keys
mgw backup [label]        Run a backup now
mgw open                  Open the IDE (WSL-aware)
```

## Automatic backups (cron)

The image ships with `/etc/cron.d/mosgarage-backup` running nightly at 02:00 via
`/usr/local/bin/backup-workspace`. It archives `.kube`, `.config/helm`, `.ssh`,
zsh/p10k configs, and `.gitconfig` from `/home/mosgarage`, keeping the last 7
archives in `/workspaces/.mosgarage-backups`.

| Env var               | Default                          | Purpose |
|-----------------------|----------------------------------|---------|
| `BACKUP_DIR`          | `/workspaces/.mosgarage-backups` | Where archives go (settable in `remoteEnv` or the cron file) |
| `BACKUP_KEEP`         | `7`                              | Archives to retain |
| `BACKUP_EXTRA_SOURCES`| *(empty)*                        | Extra paths in `$HOME` to include |
| `MOSGARAGE_BACKUP_CRON` | `0 2 * * *`                    | Override the schedule (edit the cron file) |

Run one manually: `sudo -u mosgarage backup-workspace` or `mgw backup`.

## CI / publishing (GitHub Actions)

[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml) builds
**both targets** (multi-arch amd64+arm64) and pushes to GHCR + Docker Hub on pushes to
`main`, the `release` branch, and version tags (`v*`). Smoke tests run on tags.

**One-time setup — add these repo secrets** (Settings → Secrets and variables → Actions):

- `DOCKERHUB_USERNAME` — your Docker Hub username (`mosgarage`)
- `DOCKERHUB_TOKEN` — a Docker Hub access token

GHCR publishing works out of the box via `GITHUB_TOKEN`. Tags pushed:

- `devcontainer` target → `:latest`, `:main`, `:devcontainer-YYYYMMDD`, `:vX.Y.Z`
- `code-server` target → `:code-server`, `:code-server-YYYYMMDD`, `:vX.Y.Z-code-server`

## WSL2

Two complementary stacks live in this repo:

- **`mosgarage-wsl`** (git submodule → [mosgarage/mosgarage-wsl](https://github.com/mosgarage/mosgarage-wsl)):
  the host-side WSL2 maintenance stack — `mgw install`, auto-updates, auto-backups, distro export.
  Use `make wsl-install`, `make wsl-enter`, `make wsl-backup`. Its `mgw` remains separate
  from the container `mgw` because the two CLIs manage different runtimes.
- **`code-server/`**: the standalone code-server stack with `wsl-pack.sh` /
  `wsl-import.ps1` / `wsl-export.ps1` for turning any image variant into a WSL2 distro.

## Hooks

`setup-container.sh` runs pre/post-start hooks from:

```
/usr/local/lib/devcontainer/hooks.d/pre-start     # baked into the image
/usr/local/lib/devcontainer/hooks.d/post-start
${HOST_HOME}/.devcontainer/hooks.d/pre-start      # per-user, on your host
${HOST_HOME}/.devcontainer/hooks.d/post-start
```

## Building locally

```bash
make build        # devcontainer target (local only, no push)
make build-ide    # code-server target
make auto         # build both targets + (re)start the browser IDE stack
make push         # multi-arch publish (requires Docker Hub login)
```

`make auto` is the one-command rebuild-and-run: it rebuilds the local image(s)
and recreates the IDE container (`:8080`, password via `PASSWORD=`; default
`mosgarage`). Re-running it is idempotent — `setup-container.sh` refreshes
config (hooks, kubeconfig, Helm repos, backups) on every start.

> Note: builds use `--network host` so the container build can reach package
> repos when the host resolver is a loopback stub (e.g. systemd-resolved).
> `skaffold build -p local` (config: `config/skaffold.yaml`) still works for the
> devcontainer target — **always add `--push=false`** when testing so you don't
> overwrite `:latest`.

## Kubernetes / Helm host configuration

On startup, `setup-container.sh` copies `${HOST_HOME}/.kube/config` and picks Helm
repositories from `${HOST_HOME}/.config/helm/repositories.yaml` (or the macOS
`Library/Preferences/helm` path). An optional sibling **`repositories-ohio.yaml`**
is merged in using `yq eval-all '. as $rc ireduce ({}; . *+ $rc)'`. Chart-derived
repositories are only added when neither their URL nor name is already configured;
OCI dependencies are skipped.

## Security notes

- The `mosgarage` user has **passwordless sudo** inside the container — treat the
  container as root-equivalent.
- Mounting your home directory read-only is deliberate; remove it if you don't need
  host credentials.
- ⚠️ A GitHub token was previously committed in `code-server/.env` / `.env.sample`.
  It has been scrubbed from this repo — **revoke it** on GitHub if you haven't.

## License

MIT — see [LICENSE](LICENSE).
