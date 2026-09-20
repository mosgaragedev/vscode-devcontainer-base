# config/

All image configuration files consolidated here for easy alignment and
maintenance. One place to review, edit, and align config drift.

## Build-referenced (changing these changes the image)

| File | Consumed by | Installed as |
|------|-------------|--------------|
| `zshrc.zsh` | root `Dockerfile` | `/home/mosgarage/.zshrc` |
| `zsh-aliases.zsh` | root `Dockerfile` | `/home/mosgarage/.zsh-aliases.zsh` |
| `p10k.zsh` | root `Dockerfile` | `/home/mosgarage/.p10k.zsh` |
| `bindkeys.zsh` | root Dockerfile | `/home/mosgarage/.bindkeys.zsh` |
| `workspace-supervisord.conf` | root `Dockerfile` (`:code-server` stage) | `/etc/supervisor/conf.d/workspace.conf` |
| `cron/mosgarage-backup` | root `Dockerfile` | `/etc/cron.d/mosgarage-backup` |

## Reference / documentation (not consumed by any build)

Files kept for documentation; not consumed by the image build:

| File | What it is |
|------|------------|
| `skaffold.yaml` | Local image build workflow (`skaffold build --push=false`) |
| `reference/docker-daemon.json` | Docker Desktop daemon.json reference (was misnamed `cloud-init` at repo root) |
| `reference/profile.ps1` | PowerShell host profile reference (WSL/Windows setup) |
| `reference/systemD-config.MD` | WSL systemd / multi-user service notes |
| `reference/CMakePresets.json` | CMake preset examples |
| `reference/UserPresets.json` | CMake user preset example |
| `reference/webServerApiSettings.json` | Web server API settings template |
| `reference/openapi.yaml` | XPipe API spec reference |

## Kept at repo root (intentionally)

These are tool/config files whose location matters to tools, not image content
configs:

- `.editorconfig` — editor defaults; editors scan parent directories from the
  opened file upward, so it must stay at the root.
- `package.json` / `package-lock.json` — npm manifest must stay at the repo root.
- `Makefile` — `make` targets at root.
- `ddev_linux_amd64.deb` — binary package, not a config.

## Notes

- All image-referenced paths are consolidated here; the Dockerfile copies from
  `config/` at build time. See the repository README for the full asset map
  (volumes, mounts, ports, paths, env vars).
