# scraper-api

SEO audit engine in Go (Fiber + Playwright).

## Quickstart

```bash
cd scraper-api
go mod tidy
go run github.com/playwright-community/playwright-go/cmd/playwright install --with-deps chromium
go run ./cmd/server
```

Service runs on `http://localhost:8080`.

## Endpoints

- `GET /health`
- `POST /api/audit` with body `{ "url": "https://example.com" }`

## Environment variables

```bash
PORT=8080
PLAYWRIGHT_HEADLESS=true
ALLOWED_ORIGIN=*
BROWSER_POOL_SIZE=3
LOG_LEVEL=info
VERSION=v0.1.0
```

## Tests

```bash
go test ./...
```
