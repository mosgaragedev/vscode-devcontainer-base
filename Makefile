# ╔══════════════════════════════════════════════════════════════════╗
# ║  mosgarage/vscode-devcontainer-base · Makefile                   ║
# ╚══════════════════════════════════════════════════════════════════╝

IMAGE       := mosgarage/vscode-devcontainer-base
GHCR_IMAGE  := ghcr.io/mosgaragedev/vscode-devcontainer-base
VERSION     ?= latest
PASSWORD    ?= mosgarage

.PHONY: help build build-ide build-all push push-ide auto auto-ide auto-build \
        dev ide shell stop status logs backup update bootstrap \
        wsl-install wsl-enter wsl-backup clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS=":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

# ── Build (local, no push — CI handles publishing) ───────────────────────────
build: ## Build the devcontainer target
	docker build --network host --target devcontainer -t $(IMAGE):$(VERSION) .
	@echo "✓ Built $(IMAGE):$(VERSION)"

build-ide: ## Build the code-server (browser IDE) target
	docker build --network host --target code-server -t $(IMAGE):code-server .

build-all: build build-ide ## Build both targets

push: ## Build multi-arch and push devcontainer target to Docker Hub + GHCR
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--target devcontainer \
		-t $(IMAGE):$(VERSION) -t $(GHCR_IMAGE):$(VERSION) \
		--push .
	@echo "✓ Pushed to Docker Hub and GHCR"

push-ide: ## Build multi-arch and push code-server target
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--target code-server \
		-t $(IMAGE):code-server -t $(GHCR_IMAGE):code-server \
		--push .

# ── Run ───────────────────────────────────────────────────────────────────────
dev: ## Run the devcontainer interactively with the current dir mounted
	bash scripts/mg start

ide: ## Run the browser IDE variant on :8080 (password: $(PASSWORD))
	MOSGARAGE_IDE_PASSWORD=$(PASSWORD) bash scripts/mg start --ide

shell: ## Shell into a running IDE container
	docker exec -it mosgarage-ide zsh

stop: ## Stop the IDE container
	bash scripts/mg stop mosgarage-ide

logs: ## Follow IDE container logs
	docker logs -f mosgarage-ide

# ── Maintenance ───────────────────────────────────────────────────────────────
backup: ## Trigger a config backup inside the dev container
	bash scripts/mg backup

update: ## Backup + pull latest images
	bash scripts/mg update

bootstrap: ## Run the one-shot bootstrap (auto pull + setup)
	bash scripts/bootstrap.sh

# ── One-command auto build + run ──────────────────────────────────────────────
# Rebuilds the local image(s) and (re)creates the running IDE container.
# Re-running it is idempotent: setup-container.sh refreshes config on each start.
auto: auto-build ## Build both targets, then start the browser IDE stack
	MOSGARAGE_IDE_PASSWORD=$(PASSWORD) bash scripts/mg start --ide
	@sleep 2
	bash scripts/mg status

auto-ide: ## Build the code-server target only, then start it
	$(MAKE) build-ide
	MOSGARAGE_IDE_PASSWORD=$(PASSWORD) bash scripts/mg start --ide
	@sleep 2
	bash scripts/mg status

auto-build: ## Build both targets only (no container start)
	$(MAKE) build-all

status: ## Show running mosgarage containers
	bash scripts/mg status

# ── WSL2 stack (mosgarage-wsl submodule) ──────────────────────────────────────
wsl-install: ## First-time WSL2 install via mosgarage-wsl mgw
	cd mosgarage-wsl && bash scripts/mgw.sh install

wsl-enter: ## Open zsh in the mosgarage-wsl distro
	cd mosgarage-wsl && bash scripts/mgw.sh enter

wsl-backup: ## Snapshot the WSL distro + databases
	cd mosgarage-wsl && bash scripts/mgw.sh backup

clean: ## Remove local build cache artifacts
	rm -rf dist/
	@echo "✓ Cleaned"
