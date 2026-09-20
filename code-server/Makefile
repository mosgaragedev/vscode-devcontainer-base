# ╔══════════════════════════════════════════════════════════════════╗
# ║  mosgarage/code-server · Makefile                                ║
# ╚══════════════════════════════════════════════════════════════════╝

.PHONY: help build build-all push push-all pack pack-all dev clean

REGISTRY  := docker.io/mosgarage
IMAGE     := code-server
VARIANTS  := base sdk python full
TARGET    ?= base
VERSION   ?= latest
PLATFORM  ?= linux/amd64,linux/arm64

# Mirrors env from mosgarage control plane compose
CODE_SERVER_PASSWORD ?= dev
GITHUB_USER          ?= mosgaragedev

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS=":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Build ─────────────────────────────────────────────────────────────────────
build: ## Build TARGET variant (default: base)
	docker build \
		--target $(TARGET) \
		-t $(REGISTRY)/$(IMAGE):$(TARGET) \
		-t $(REGISTRY)/$(IMAGE):$(TARGET)-$(VERSION) \
		.
	@echo "✓ Built $(REGISTRY)/$(IMAGE):$(TARGET)"

build-all: ## Build all variants
	@for v in $(VARIANTS); do \
		echo "▸ Building $$v..."; \
		$(MAKE) --no-print-directory build TARGET=$$v; \
	done

# ── Push (multi-arch via buildx) ──────────────────────────────────────────────
push: ## Build multi-arch and push TARGET to Docker Hub
	docker buildx build \
		--platform $(PLATFORM) \
		--target $(TARGET) \
		--tag $(REGISTRY)/$(IMAGE):$(TARGET) \
		--tag $(REGISTRY)/$(IMAGE):$(TARGET)-$(VERSION) \
		--push .
	@# base also gets :latest (mirrors mosgarage/mosgarage workspace-base)
	@if [ "$(TARGET)" = "base" ]; then \
		docker buildx build \
			--platform $(PLATFORM) \
			--target base \
			--tag $(REGISTRY)/$(IMAGE):latest \
			--push . && \
		echo "✓ Also tagged as :latest"; \
	fi
	@echo "✓ Pushed $(REGISTRY)/$(IMAGE):$(TARGET)"

push-all: ## Push all variants
	@for v in $(VARIANTS); do \
		echo "▸ Pushing $$v..."; \
		$(MAKE) --no-print-directory push TARGET=$$v; \
	done

# ── WSL pack + import ─────────────────────────────────────────────────────────
pack: build ## Build TARGET then export as WSL2 rootfs tarball
	@bash scripts/wsl-pack.sh $(TARGET)

pack-all: ## Pack all variants as WSL2 tarballs
	@for v in $(VARIANTS); do \
		echo "▸ Packing $$v..."; \
		$(MAKE) --no-print-directory pack TARGET=$$v; \
	done

# ── Local dev ─────────────────────────────────────────────────────────────────
dev: ## Run TARGET interactively with hot-reload volume
	docker run --rm -it \
		-p 8080:8080 \
		-p 2222:2222 \
		-p 3000:3000 \
		-p 4000:4000 \
		-e CODE_SERVER_PASSWORD=$(CODE_SERVER_PASSWORD) \
		-e GITHUB_USER=$(GITHUB_USER) \
		-e GIT_NAME="mosgaragedev" \
		-e GIT_EMAIL="mosgaragedev@users.noreply.github.com" \
		-v mosgarage-cs-workspace:/home/mosgarage/workspace \
		--name mosgarage-cs-$(TARGET) \
		$(REGISTRY)/$(IMAGE):$(TARGET)

# ── Git ───────────────────────────────────────────────────────────────────────
shell: ## Shell into running dev container
	docker exec -it mosgarage-cs-$(TARGET) bash

logs: ## Tail dev container logs
	docker logs -f mosgarage-cs-$(TARGET)

# ── Clean ─────────────────────────────────────────────────────────────────────
clean: ## Remove dist/ directory
	rm -rf dist/
	@echo "✓ Cleaned dist/"
