# Repository Guide

## Overview

This repository builds `mosgarage/vscode-devcontainer-base` (Docker Hub) and
`ghcr.io/mosgaragedev/vscode-devcontainer-base` (GHCR), a reusable Ubuntu 24.04
base for VS Code development containers. It supplies common development utilities,
the Kubernetes toolchain, AI coding agent CLIs (Claude Code, Gemini CLI, Codex, aider),
an optional code-server browser-IDE target, automatic cron backups, and a configured
Zsh environment. The image works with the `docker-outside-of-docker` devcontainer
feature; it does not provide Docker itself.

## Repository Layout

- `Dockerfile` is the image definition. Multi-stage: the `devcontainer` target
  (default) contains the full toolchain; the `code-server` target extends it with
  code-server (:8080), sshd (:2222), cron backups, and supervisor.
- `install-system-dependencies.sh` installs system-wide tooling (yq v4, kubectl,
  helm, k9s, kubeseal, skaffold, stern); runs as root during the build.
- `install-user-dependencies.sh` runs as `mosgarage`. Installs krew plugins, uv,
  Oh-My-Zsh + Powerlevel10k + plugins, and aider. The ADP step is skipped when
  `adp-connect` is absent (release builds).
- `adp-connect.sh` is the standalone interactive ADP bootstrap utility. Internal
  builds only; excluded from the `release` branch.
- `setup-container.sh` configures state after startup: hooks, kubeconfig, Helm
  repositories (including the `repositories-ohio.yaml` merge), code-server
  password handling, and the cron backup daemon.
- `docker-entrypoint.sh` starts the code-server stack when `MOSGARAGE_MODE=code-server`,
  otherwise drops into a login shell as `mosgarage`.
- `workspace-supervisord.conf` (in `config/`) supervises code-server, sshd, cron,
  and the optional mosgarage agent in the `:code-server` target.
- `mgw` is the in-container workspace CLI (start/stop/status/logs/password/keys/backup).
- `scripts/` contains host and maintenance tooling:
  - `bootstrap.sh` — one-shot auto pull + setup (curl|bash friendly, idempotent)
  - `mg` — host-side container manager (start/stop/exec/backup/update/open)
  - `backup-workspace.sh` — cron-driven config backup with rotation
  - `workspace-startup.sh` — code-server target entrypoint script
- `config/` consolidates all image configuration files (see `config/README.md`):
  - `config/zshrc.zsh`, `config/zsh-aliases.zsh`, `config/p10k.zsh`,
    `config/bindkeys.zsh` define the shell experience.
  - `config/cron/mosgarage-backup` is the nightly backup cron definition.
  - `config/reference/` holds documentation-only configs (PowerShell profile,
    Docker daemon.json, CMake presets, XPipe OpenAPI spec, WSL systemd notes).
  - `config/skaffold.yaml` defines the local image build workflow (use
    `--push=false` when testing).
- `debug-webserver.py` is a small Flask server for container debugging.
- `Makefile` wraps local build/run/maintenance targets.
- `.github/workflows/docker-publish.yml` builds both targets multi-arch and pushes
  to GHCR + Docker Hub (requires `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` secrets).
- `code-server/` is the vendored standalone code-server stack (WSL2 packing, compose,
  nginx, api/server services, landing page). Its root `Dockerfile` is kept for the
  standalone variants; the merged-in-browser-IDE experience lives in the root
  Dockerfile's `code-server` target.
- `mosgarage-wsl/` is a git submodule of `mosgarage/mosgarage-wsl` — the WSL2
  maintenance stack (mgw CLI, distro install/backup/export).
- `README.md` is the end-user source of truth.

## Branches

- `main` — full workspace; images publish from here.
- `release` — sharable subset: image project only (no workspace tooling, no
  `code-server/` vendored stack, no submodule). Keep it in sync when the image
  changes.
- `gh-pages` — landing page (HTML). Deploy via GitHub Pages "Deploy from branch".

## Build and Development

Local build (never pushes):

```bash
make build          # devcontainer target
make build-ide      # code-server target
```

Publishing is handled by CI on push to `main` / `release` / `v*` tags. For local
Skaffold use, always add `--push=false` to avoid overwriting `:latest`.

Do not add Docker socket mounts to example devcontainer configurations: the
documented `docker-outside-of-docker` feature owns that integration.

## Runtime Model

The final image starts as root; `docker-entrypoint.sh` opens a login shell as
`mosgarage` (uid 1001, zsh, passwordless sudo) or starts the supervisor stack in
the code-server target. `setup-container.sh` expects an optional `HOST_HOME`
mount and creates or refreshes configuration under `/home/mosgarage`. It runs
image hooks from:

```text
/usr/local/lib/devcontainer/hooks.d/pre-start
/usr/local/lib/devcontainer/hooks.d/post-start
```

It also runs equivalent host hooks from `${HOST_HOME}/.devcontainer/hooks.d/`
when available. Preserve `mosgarage:mosgarage` ownership of files copied into
`/home/mosgarage`.

## Backups

`/etc/cron.d/mosgarage-backup` runs `/usr/local/bin/backup-workspace` nightly as
`mosgarage`. Archives land in `/workspaces/.mosgarage-backups` (fallback
`~/backups/mosgarage`) with `BACKUP_KEEP` rotation (default 7). `setup-container.sh`
starts cron and applies `BACKUP_DIR` overrides.

## Host Kubernetes and Helm Configuration

When `HOST_HOME` is available, startup copies `${HOST_HOME}/.kube/config` to
`/home/mosgarage/.kube/config`. It selects a Helm repository configuration from
these host paths:

```text
${HOST_HOME}/.config/helm/repositories.yaml
${HOST_HOME}/Library/Preferences/helm/repositories.yaml
```

An optional sibling `repositories-ohio.yaml` is merged with the selected
`repositories.yaml` before the script processes dependencies from
`/workspaces/*/helm/Chart.yaml`. Chart-derived repositories are only added when
neither their URL nor their generated name is already configured; OCI
dependencies are skipped.

## Shell Script Conventions

- Shell scripts use Bash. Keep existing four-space indentation and quote variable
  expansions. Files must be LF (`bash -n` catches CRLF).
- Use `set -e` in installer scripts where a failed command must abort image
  construction. Prefer per-item fallbacks (`|| echo "skipping ..."`) for
  optional components (krew plugins, AI tools).
- Scripts that run during the image build must be non-interactive.
- Keep downloads architecture-aware using `DPKG_ARCHITECTURE` (map to `GO_ARCH`
  where upstream uses amd64/arm64 naming).
- Update `README.md` whenever image behavior, supported configuration paths, or
  user workflows change.

## YAML and yq

The repository uses Mike Farah `yq` v4 (installed from its GitHub release — not
the pip `yq`). For multi-file YAML transformations, use `yq eval-all`:

```bash
yq eval-all '. as $repository_config ireduce ({}; . *+ $repository_config)' \
  repositories.yaml repositories-ohio.yaml
```

`ireduce` deep-merges the documents and `*+` appends arrays, preserving both
`repositories` lists.

## Validation

Run focused checks for modified scripts:

```bash
bash -n setup-container.sh
bash -n install-system-dependencies.sh
bash -n install-user-dependencies.sh
bash -n mgw scripts/backup-workspace.sh scripts/bootstrap.sh scripts/mg
git diff --check
```

For a Helm merge change, run the exact `yq eval-all` expression against two small
YAML fixtures and verify that each file's repository entries remain in the result.
Build the image (`make build` / `make build-ide`) for changes affecting the
`Dockerfile`, package installation, entrypoint behavior, or tooling versions.

When substantive changes to the container are made, instruct the user to rebuild
the devcontainer to test changes.
