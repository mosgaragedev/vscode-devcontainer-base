#!/usr/bin/env bash
# =============================================================================
# post-create.sh — runs ONCE after the devcontainer is first built
# Sets up databases, seeds, and installs service dependencies
# =============================================================================
set -euo pipefail

info()    { echo -e "\033[1;36m[mosgarage]\033[0m $*"; }
success() { echo -e "\033[1;32m[mosgarage]\033[0m $*"; }

info "Running post-create setup..."

# ---------------------------------------------------------------------------
# Wait for databases to be ready
# ---------------------------------------------------------------------------
info "Waiting for PostgreSQL..."
until psql postgresql://mosgarage:mosgarage@postgres:5432/mosgarage -c '\q' 2>/dev/null; do
    sleep 2
done
success "PostgreSQL ready"

info "Waiting for MongoDB..."
until mongosh "mongodb://mosgarage:mosgarage@mongodb:27017/mosgarage" --eval "db.runCommand({ ping: 1 })" --quiet 2>/dev/null; do
    sleep 2
done
success "MongoDB ready"

info "Waiting for Redis..."
until redis-cli -h redis -p 6379 -a mosgarage ping 2>/dev/null | grep -q PONG; do
    sleep 2
done
success "Redis ready"

# ---------------------------------------------------------------------------
# PostgreSQL — create per-service databases
# ---------------------------------------------------------------------------
info "Creating PostgreSQL service databases..."
psql postgresql://mosgarage:mosgarage@postgres:5432/mosgarage <<'EOF'
CREATE DATABASE mosgarage_auth       OWNER mosgarage;
CREATE DATABASE mosgarage_learners   OWNER mosgarage;

-- Auth schema
\c mosgarage_auth
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'learner',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Learner schema
\c mosgarage_learners
CREATE TABLE IF NOT EXISTS enrollments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    course_id   TEXT NOT NULL,
    progress    INTEGER DEFAULT 0,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

CREATE TABLE IF NOT EXISTS progress_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    course_id   TEXT NOT NULL,
    lesson_id   TEXT NOT NULL,
    event_type  TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);
EOF
success "PostgreSQL schemas created"

# ---------------------------------------------------------------------------
# MongoDB — create per-service collections and indexes
# ---------------------------------------------------------------------------
info "Setting up MongoDB collections..."
mongosh "mongodb://mosgarage:mosgarage@mongodb:27017/" --quiet <<'EOF'
// Content service DB
db = db.getSiblingDB('mosgarage_content');
db.createCollection('courses');
db.createCollection('lessons');
db.createCollection('quizzes');
db.courses.createIndex({ slug: 1 }, { unique: true });
db.courses.createIndex({ tags: 1 });
db.lessons.createIndex({ courseId: 1 });
db.quizzes.createIndex({ lessonId: 1 });

// Seed a sample course
db.courses.insertOne({
    title: "Getting Started with Mo's Garage",
    slug: "mosgarage-intro",
    description: "Introduction to the platform",
    tags: ["intro", "platform"],
    published: true,
    createdAt: new Date()
});

// Notifications DB
db = db.getSiblingDB('mosgarage_notifications');
db.createCollection('notifications');
db.createCollection('templates');
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ read: 1 });
print("MongoDB setup complete");
EOF
success "MongoDB collections ready"

# ---------------------------------------------------------------------------
# Redis — set some default keys for health checking
# ---------------------------------------------------------------------------
info "Initialising Redis..."
redis-cli -h redis -p 6379 -a mosgarage SET "mosgarage:health" "ok" EX 86400 > /dev/null
redis-cli -h redis -p 6379 -a mosgarage SET "mosgarage:version" "1.0.0" > /dev/null
success "Redis ready"

# ---------------------------------------------------------------------------
# Install service dependencies if package.json exists
# ---------------------------------------------------------------------------
info "Installing Node dependencies for services..."
for svc in api-gateway auth-service content-service learner-service notification-service; do
    dir="/workspace/services/${svc}"
    if [[ -f "${dir}/package.json" ]]; then
        info "  → ${svc}"
        (cd "${dir}" && npm install --silent)
    fi
done
success "Node dependencies installed"

# ---------------------------------------------------------------------------
# Install Python deps if requirements.txt exists
# ---------------------------------------------------------------------------
for svc in /workspace/services/*/; do
    if [[ -f "${svc}/requirements.txt" ]]; then
        info "Installing Python deps for $(basename ${svc})..."
        pip3 install -q -r "${svc}/requirements.txt"
    fi
done

# ---------------------------------------------------------------------------
# .NET restore if .sln or .csproj exists
# ---------------------------------------------------------------------------
for svc in /workspace/services/*/; do
    if ls "${svc}"*.sln "${svc}"*.csproj 2>/dev/null | grep -q .; then
        info "Restoring .NET deps for $(basename ${svc})..."
        dotnet restore "${svc}" --verbosity quiet
    fi
done

success "Post-create setup complete!"
echo ""
echo "  Database shortcuts:"
echo "    pgcli     → PostgreSQL"
echo "    mongocli  → MongoDB shell"
echo "    rcli      → Redis CLI"
echo ""
echo "  Stack shortcuts:"
echo "    mg-up     → start all microservices"
echo "    mg-logs   → tail all logs"
echo "    mg-ps     → show container status"
