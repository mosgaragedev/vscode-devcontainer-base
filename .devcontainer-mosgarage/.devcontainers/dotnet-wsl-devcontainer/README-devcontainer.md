# mosgarage · Dev Environment Setup

One devcontainer config — works identically in **VS Code** and **Visual Studio 2022**.
Docker Desktop (WSL2 backend) runs everything. You get PostgreSQL, Traefik, hot-reload,
debugging, EF migrations, and git sync, all pre-wired.

---

## Prerequisites

| Tool | Min version | Notes |
|---|---|---|
| Docker Desktop | 4.x | Enable WSL2 backend in Settings |
| WSL2 Ubuntu | 22.04 | Your working distro |
| VS Code | Any recent | + Dev Containers extension |
| Visual Studio | 2022 v17.4+ | Container Tools workload |

---

## VS Code — Quickstart (30 seconds)

```bash
# 1. Open the repo from WSL2 (not the Windows path)
code \\wsl.localhost\Ubuntu-24.04\home\mosgarage\workspace\dotnet-wsl-devcontainer

# 2. VS Code shows a popup: "Reopen in Container" → click it
#    (or: Ctrl+Shift+P → "Dev Containers: Reopen in Container")

# 3. First build takes ~3 min (downloads SDK image, restores packages, runs migrations)
#    Subsequent opens are instant (cached layers + NuGet volume)

# 4. Press F5 → picks up launch.json → server starts with debugger attached
#    Browser opens automatically at http://localhost:7070/swagger
```

**That's it.** post-create.sh runs automatically and handles everything else.

---

## Visual Studio 2022 — Quickstart

### Option A: Open in Dev Container (recommended)

1. **File → Open → Folder** → navigate to your WSL path:
   `\\wsl.localhost\Ubuntu\home\mosgarage\dev\projects`
2. VS detects `.devcontainer/devcontainer.json` → shows **"Reopen in Container"** notification → click it
3. In the debug dropdown, select **`Docker Compose`** or **`Docker`**
4. Press **F5**

### Option B: Direct WSL2 (no container)

1. **File → Open → Folder** → same path as above
2. In the debug dropdown, select **`WSL2`**
3. Press **F5** — VS SSHes into Ubuntu and runs the server there directly
4. Breakpoints work exactly as if it were local

> For WSL2 profile: make sure PostgreSQL is reachable on `localhost:5432` in your distro
> (either run `docker compose up -d database` from WSL, or have a local Postgres install).

---

## What runs where

```
Your machine (Windows)
└── Docker Desktop (WSL2 backend)
    └── docker-compose.yml + docker-compose.devcontainer.yml
        ├── devcontainer          ← your editor attaches here
        │   ├── .NET 8 SDK
        │   ├── Node 20
        │   ├── Docker CLI
        │   └── ZSH + all tools
        ├── database              ← PostgreSQL 16 (always running)
        └── traefik               ← reverse proxy (always running)
```

The `mosgarage` production service is **overridden to idle** in dev mode — you run
`dotnet watch` yourself (or press F5) so you get a real debugger with hot-reload.

---

## Common commands (inside the container terminal)

```bash
# Start server with hot-reload (alias defined in .zshrc)
server

# Or explicitly:
cd /workspace/src/Mosgarage.Server && dotnet watch run

# Apply EF migrations
migrate

# Add a new migration
dotnet ef migrations add MyMigration

# Connect to postgres
psql-mg

# Build everything
build

# Run all tests
test

# Force git push now
git-push-now

# Docker compose shortcuts
dc up -d
dc logs -f
dc ps
```

---

## Debug configurations (F5 dropdown)

| Config | What it does |
|---|---|
| `▶ Launch Mosgarage.Server` | Build + launch with full debugger |
| `🔥 Hot Reload — Mosgarage.Server` | `dotnet watch` + debugger |
| `▶ Launch Mosgarage.Agent` | Launch agent in debugger |
| `🚀 Full Stack (Server + Agent)` | Both simultaneously |
| `Attach to Mosgarage.Server` | Attach to an already-running process |

---

## Resetting the environment

```bash
# Rebuild container from scratch (keeps DB data)
# Ctrl+Shift+P → "Dev Containers: Rebuild Container"

# Full reset including volumes (loses DB data)
docker compose -f docker-compose.yml -f .devcontainer/docker-compose.devcontainer.yml down -v

# Reset just the database
docker volume rm mosgarage_postgres_data
```
