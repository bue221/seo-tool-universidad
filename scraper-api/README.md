# scraper-api

Motor de auditoría SEO en Go (Fiber + Playwright-Go). Ver [`agents.md`](./agents.md) para el contrato del agente.

## Setup (placeholder)

```bash
# Cuando estés listo:
go get github.com/gofiber/fiber/v2
go get github.com/playwright-community/playwright-go
go run github.com/playwright-community/playwright-go/cmd/playwright install --with-deps chromium
```

## Endpoint principal

```
POST /api/audit
Content-Type: application/json

{ "url": "https://ejemplo.com" }
```

Respuesta: ver contrato JSON en `openspec/specs/audit-contract/` (root del monorepo).

## Variables de entorno

```
PORT=8080
PLAYWRIGHT_HEADLESS=true
```
