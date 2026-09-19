#!/usr/bin/env bash
# ============================================================
# mosgarage · .devcontainer/scripts/post-create.sh
# Runs ONCE after the devcontainer is first created.
# Sets up the full dev environment automatically.
# ============================================================

set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  mosgarage · devcontainer post-create setup          ║"
echo "╚══════════════════════════════════════════════════════╝"

cd /workspace

# ── .NET restore ─────────────────────────────────────────────────
echo ""
echo "📦 Restoring .NET packages..."
dotnet restore Mosgarage.sln
echo "✅ Packages restored"

# ── Node.js install (ClientApp) ───────────────────────────────────
if [[ -f "src/Mosgarage.Server/ClientApp/package.json" ]]; then
  echo ""
  echo "📦 Installing Node.js dependencies (ClientApp)..."
  cd src/Mosgarage.Server/ClientApp && npm ci && cd /workspace
  echo "✅ Node packages installed"
fi

# ── Wait for PostgreSQL ───────────────────────────────────────────
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  pg_isready -h database -U mosgarage -d mosgarage -q 2>/dev/null && break
  echo "  ... attempt $i/30"
  sleep 2
done
pg_isready -h database -U mosgarage -d mosgarage -q && echo "✅ PostgreSQL ready" || \
  echo "⚠️  PostgreSQL not ready — run migrations manually with: make migrate"

# ── EF Core migrations ────────────────────────────────────────────
echo ""
echo "🗄️  Applying EF Core migrations..."
cd /workspace/src/Mosgarage.Server
dotnet ef database update --no-build 2>/dev/null || \
  dotnet ef database update && echo "✅ Migrations applied" || \
  echo "⚠️  Migrations failed — the app may still start and auto-migrate"
cd /workspace

# ── Git setup ─────────────────────────────────────────────────────
echo ""
echo "🔧 Configuring git..."
git config --global --add safe.directory /workspace
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global push.autoSetupRemote true
git config --global core.autocrlf input   # critical for WSL2 — LF only

if [[ -n "${GITHUB_USER:-}" ]]; then
  git config --global user.name  "${GIT_NAME:-${GITHUB_USER}}"
  git config --global user.email "${GIT_EMAIL:-${GITHUB_USER}@users.noreply.github.com}"
  echo "✅ Git identity: ${GITHUB_USER}"
fi

# ── SSH key (fetch from GitHub if GITHUB_USER is set) ─────────────
if [[ -n "${GITHUB_USER:-}" ]] && [[ ! -f /root/.ssh/id_ed25519 ]]; then
  echo ""
  echo "🔑 Generating SSH keypair for dev container..."
  ssh-keygen -t ed25519 -f /root/.ssh/id_ed25519 -N "" \
    -C "mosgarage-devcontainer-$(date +%Y%m%d)" -q
  chmod 600 /root/.ssh/id_ed25519
  echo "✅ SSH key generated. Public key:"
  cat /root/.ssh/id_ed25519.pub
fi

# ── .env file ─────────────────────────────────────────────────────
if [[ ! -f /workspace/.env ]]; then
  echo ""
  echo "📄 Creating .env from .env.example..."
  cp /workspace/.env.example /workspace/.env
  # Auto-generate a secret key
  SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | head -c 64)
  sed -i "s|CHANGE-ME-generate-with-openssl-rand-hex-32|${SECRET}|g" /workspace/.env
  echo "✅ .env created with generated secret key"
fi

# ── SQLTools connection config (VS Code DB explorer) ──────────────
mkdir -p /workspace/.vscode
cat > /workspace/.vscode/settings.local.json <<'JSON'
{
  "sqltools.connections": [
    {
      "name":     "mosgarage-postgres (dev)",
      "driver":   "PostgreSQL",
      "server":   "database",
      "port":     5432,
      "database": "mosgarage",
      "username": "mosgarage",
      "password": "mosgarage"
    }
  ]
}
JSON

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅  devcontainer setup complete!                    ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Start server:  dotnet watch run                     ║"
echo "║  (from /workspace/src/Mosgarage.Server)              ║"
echo "║                                                      ║"
echo "║  Or press F5 in VS Code / Visual Studio to debug     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
