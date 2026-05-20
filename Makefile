# =============================================================================
# seo-custom-tool — Makefile raíz
# Fachada de orquestación para el monorepo híbrido (Next.js + Go).
# =============================================================================

# --- Configuración ----------------------------------------------------------
WEB_DIR := dashboard-web
API_DIR := scraper-api

# Detección de toolchain
NPM     ?= npm
GO      ?= go

# Color helpers (TTY-aware)
BLUE   := \033[1;34m
GREEN  := \033[1;32m
YELLOW := \033[1;33m
RESET  := \033[0m

.DEFAULT_GOAL := help

# Detección de comando docker compose (v2 plugin) vs docker-compose (v1)
DOCKER_COMPOSE ?= $(shell if docker compose version >/dev/null 2>&1; then echo "docker compose"; else echo "docker-compose"; fi)

# Targets que no producen archivos
.PHONY: help check setup setup-web setup-api env playwright \
        dev-web dev-api \
        build build-web build-api \
        test test-web test-api \
        test-coverage test-web-coverage test-api-coverage \
        lint typecheck \
        clean clean-web clean-api \
        docker-check docker-build docker-up docker-up-detached \
        docker-down docker-logs docker-ps docker-restart docker-clean

# --- Ayuda ------------------------------------------------------------------
help: ## Muestra esta ayuda
	@printf "$(BLUE)seo-custom-tool$(RESET) — targets disponibles:\n\n"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@printf "\n$(YELLOW)Quick start (local):$(RESET)\n"
	@printf "  1) make check           # verifica node + go\n"
	@printf "  2) make setup           # instala deps de web + api\n"
	@printf "  3) make env             # crea .env.local desde el example\n"
	@printf "  4) make playwright      # instala Chromium para el scraper\n"
	@printf "  5) make dev-api         # terminal 1: API en :8080\n"
	@printf "  6) make dev-web         # terminal 2: web en :3000\n\n"
	@printf "$(YELLOW)Quick start (docker):$(RESET)\n"
	@printf "  1) make docker-check         # verifica docker + compose\n"
	@printf "  2) make env                  # crea dashboard-web/.env.local\n"
	@printf "  3) make docker-up-detached   # levanta web + api en background\n"
	@printf "  4) make docker-logs          # tail de logs\n\n"

# --- Pre-flight -------------------------------------------------------------
check: ## Verifica que node>=20 y go>=1.23 estén instalados
	@command -v node >/dev/null 2>&1 || { printf "$(YELLOW)✗ node no encontrado$(RESET)\n"; exit 1; }
	@command -v $(NPM) >/dev/null 2>&1 || { printf "$(YELLOW)✗ npm no encontrado$(RESET)\n"; exit 1; }
	@command -v $(GO) >/dev/null 2>&1 || { printf "$(YELLOW)✗ go no encontrado$(RESET)\n"; exit 1; }
	@printf "$(GREEN)✓$(RESET) node $$(node -v)\n"
	@printf "$(GREEN)✓$(RESET) npm  $$($(NPM) -v)\n"
	@printf "$(GREEN)✓$(RESET) go   $$($(GO) version | awk '{print $$3}')\n"

# --- Setup ------------------------------------------------------------------
setup: setup-web setup-api ## Instala dependencias de web y api
	@printf "$(GREEN)✓ setup completo$(RESET)\n"

setup-web: ## Instala deps del frontend (npm ci si hay lockfile, si no npm install)
	@printf "$(BLUE)→ instalando deps de $(WEB_DIR)$(RESET)\n"
	@cd $(WEB_DIR) && if [ -f package-lock.json ]; then $(NPM) ci; else $(NPM) install; fi

setup-api: ## Descarga módulos Go y los ordena
	@printf "$(BLUE)→ instalando deps de $(API_DIR)$(RESET)\n"
	@cd $(API_DIR) && $(GO) mod tidy

env: ## Crea dashboard-web/.env.local desde el example si no existe
	@if [ ! -f $(WEB_DIR)/.env.local ]; then \
		cp $(WEB_DIR)/.env.local.example $(WEB_DIR)/.env.local; \
		printf "$(GREEN)✓ creado $(WEB_DIR)/.env.local$(RESET) — completa las variables\n"; \
	else \
		printf "$(YELLOW)• $(WEB_DIR)/.env.local ya existe, se respeta$(RESET)\n"; \
	fi

playwright: ## Instala Chromium para playwright-go (requerido por el scraper)
	@printf "$(BLUE)→ instalando Chromium para playwright-go$(RESET)\n"
	@cd $(API_DIR) && $(GO) run github.com/playwright-community/playwright-go/cmd/playwright install --with-deps chromium

# --- Dev --------------------------------------------------------------------
dev-web: ## Arranca el frontend Next.js (http://localhost:3000)
	@printf "$(BLUE)→ next dev en $(WEB_DIR)$(RESET)\n"
	@cd $(WEB_DIR) && $(NPM) run dev

dev-api: ## Arranca la API Go (http://localhost:8080)
	@printf "$(BLUE)→ go run ./cmd/server en $(API_DIR)$(RESET)\n"
	@cd $(API_DIR) && $(GO) run ./cmd/server

# --- Build ------------------------------------------------------------------
build: build-web build-api ## Compila web y api

build-web: ## next build
	@cd $(WEB_DIR) && $(NPM) run build

build-api: ## Compila el binario Go a scraper-api/bin/server
	@mkdir -p $(API_DIR)/bin
	@cd $(API_DIR) && $(GO) build -o bin/server ./cmd/server
	@printf "$(GREEN)✓ binario en $(API_DIR)/bin/server$(RESET)\n"

# --- Test / lint / types ----------------------------------------------------
test: test-web test-api ## Corre tests de web y api

test-web: ## vitest run
	@cd $(WEB_DIR) && $(NPM) test

test-api: ## go test ./...
	@cd $(API_DIR) && $(GO) test ./...

test-coverage: test-web-coverage test-api-coverage ## Corre suite completa con reporte de cobertura

test-web-coverage: ## vitest --coverage (la 1ra vez te pide instalar @vitest/coverage-v8)
	@printf "$(BLUE)→ vitest --coverage en $(WEB_DIR)$(RESET)\n"
	@cd $(WEB_DIR) && $(NPM) test -- --coverage
	@printf "$(GREEN)✓ reporte: $(WEB_DIR)/coverage/index.html$(RESET)\n"

test-api-coverage: ## go test con coverprofile + reporte HTML
	@printf "$(BLUE)→ go test -coverprofile en $(API_DIR)$(RESET)\n"
	@cd $(API_DIR) && $(GO) test -coverprofile=coverage.out ./...
	@printf "\n$(YELLOW)Resumen de cobertura:$(RESET)\n"
	@cd $(API_DIR) && $(GO) tool cover -func=coverage.out | tail -n 1
	@cd $(API_DIR) && $(GO) tool cover -html=coverage.out -o coverage.html
	@printf "$(GREEN)✓ reporte: $(API_DIR)/coverage.html$(RESET)\n"

lint: ## next lint
	@cd $(WEB_DIR) && $(NPM) run lint

typecheck: ## tsc --noEmit
	@cd $(WEB_DIR) && $(NPM) run typecheck

# --- Clean ------------------------------------------------------------------
clean: clean-web clean-api ## Limpia artefactos de build de web y api

clean-web: ## Borra .next, node_modules, tsbuildinfo y coverage/
	@rm -rf $(WEB_DIR)/.next $(WEB_DIR)/node_modules $(WEB_DIR)/tsconfig.tsbuildinfo $(WEB_DIR)/coverage
	@printf "$(GREEN)✓ limpio $(WEB_DIR)$(RESET)\n"

clean-api: ## go clean + borra bin/ y reportes de coverage
	@cd $(API_DIR) && $(GO) clean
	@rm -rf $(API_DIR)/bin $(API_DIR)/coverage.out $(API_DIR)/coverage.html
	@printf "$(GREEN)✓ limpio $(API_DIR)$(RESET)\n"

# --- Docker -----------------------------------------------------------------
docker-check: ## Verifica que docker y docker compose estén instalados
	@command -v docker >/dev/null 2>&1 || { printf "$(YELLOW)✗ docker no encontrado$(RESET)\n"; exit 1; }
	@docker compose version >/dev/null 2>&1 || docker-compose --version >/dev/null 2>&1 || { printf "$(YELLOW)✗ docker compose no encontrado$(RESET)\n"; exit 1; }
	@printf "$(GREEN)✓$(RESET) docker $$(docker --version | awk '{print $$3}' | tr -d ',')\n"
	@printf "$(GREEN)✓$(RESET) usando: $(DOCKER_COMPOSE)\n"

docker-build: ## Construye las imágenes de ambos servicios
	@printf "$(BLUE)→ build de imágenes (scraper-api + dashboard-web)$(RESET)\n"
	@$(DOCKER_COMPOSE) build

docker-up: env ## Levanta ambos servicios en foreground (Ctrl+C para detener)
	@printf "$(BLUE)→ docker compose up$(RESET)\n"
	@$(DOCKER_COMPOSE) up

docker-up-detached: env ## Levanta ambos servicios en background
	@printf "$(BLUE)→ docker compose up -d$(RESET)\n"
	@$(DOCKER_COMPOSE) up -d
	@printf "$(GREEN)✓ servicios arriba:$(RESET)\n"
	@printf "  • dashboard-web → http://localhost:3000\n"
	@printf "  • scraper-api   → http://localhost:8080\n"

docker-down: ## Detiene y remueve los contenedores
	@$(DOCKER_COMPOSE) down

docker-logs: ## Sigue los logs de ambos servicios (Ctrl+C para salir)
	@$(DOCKER_COMPOSE) logs -f

docker-ps: ## Lista contenedores y su estado
	@$(DOCKER_COMPOSE) ps

docker-restart: ## Reinicia ambos servicios
	@$(DOCKER_COMPOSE) restart

docker-clean: ## Detiene, remueve contenedores, redes, volúmenes e imágenes locales
	@$(DOCKER_COMPOSE) down -v --rmi local --remove-orphans
	@printf "$(GREEN)✓ stack de Docker limpio$(RESET)\n"
