# mosgarage/code-server

> Managed workspace image — VS Code in the browser, WSL2-native, multi-variant.  
> Extends the `mosgarage` control plane's `workspace-base` stage.

## Docker Hub

```
docker pull mosgarage/code-server:latest      # base (mirrors workspace-base)
docker pull mosgarage/code-server:sdk         # + .NET 8 SDK
docker pull mosgarage/code-server:python      # + Python 3.12 + uv
docker pull mosgarage/code-server:full        # SDK + Python
```

## Run (standalone / local dev)

```bash
cp .env.example .env   # edit CODE_SERVER_PASSWORD
make dev               # TARGET=base by default
# → http://localhost:8080
```

## WSL2 distro

```bash
# 1. Build and pack
make pack TARGET=base      # → dist/mosgarage-cs-base.tar.gz

# 2. Import on Windows (PowerShell)
.\scripts\wsl-import.ps1 -Variant base

# 3. Start workspace
wsl -d MosgarageCS-base -- mgw start
wsl -d MosgarageCS-base -- mgw status

# 4. Snapshot before an update
.\scripts\wsl-export.ps1 -Variant base

# 5. Update: force re-import from new image
.\scripts\wsl-import.ps1 -Variant base -Force
```

## Variants

| Tag | Contents |
|-----|----------|
| `:base` · `:latest` | Ubuntu 22.04 + code-server + Node 20 LTS + .NET 8 aspnetcore runtime |
| `:sdk` | base + .NET 8 SDK |
| `:python` | base + Python 3.12 + uv |
| `:full` | .NET 8 SDK + Python 3.12 (top-grade distro) |

## Ports

| Port | Service |
|------|---------|
| `8080` | code-server (VS Code browser IDE) |
| `3000` | user app dev port |
| `4000` | user app dev port |
| `7072` | mosgarage workspace agent |
| `2222` | SSH |

## mgw CLI

```
mgw start                   Start all workspace services
mgw stop / restart          Stop / restart services
mgw status                  Show service status and runtimes
mgw logs [service]          Tail logs (default: code-server)
mgw password <pw>           Set code-server password
mgw keys <github-user>      Import GitHub SSH public keys
mgw agent                   Check agent status
mgw open                    Open code-server in browser (WSL-aware)
mgw update                  Show update instructions
```

## Relation to mosgarage control plane

```
mosgarage/mosgarage          ← control plane (ASP.NET 8, Traefik, PostgreSQL)
  └── workspace-base stage   ← this image (mosgarage/code-server:latest)
        ├── :base             provisioned by docker provisioner
        ├── :sdk              workspace templates
        ├── :python
        └── :full
```

The `workspace-base` stage in the control plane `Dockerfile` and the `base` target here are kept in sync. When the control plane's `push-workspace` target runs, it pushes the same image as `mosgarage/workspace:latest`.

## Build

```bash
make build TARGET=full              # local single-arch
make push  TARGET=full VERSION=0.4  # multi-arch push to Docker Hub
make push-all                       # push all variants
```
