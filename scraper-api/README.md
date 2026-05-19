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

### `POST /api/audit` response (v0.2.0)

See `openspec/specs/audit-contract/spec.md` for the full schema. Highlights:

- `onPage` — title/meta/h1/images length scores and alt coverage.
- `tracking` — GTM / GA4 / Google Ads detection.
- `keywords.top` — top-5 keyword density.
- `sentiment` — polarity + score (heuristic).
- `woorank` *(v0.2.0+, optional)* — 16 technical SEO checks with aggregated
  `score ∈ [0, 1]` weighted by check criticality. Issues 3 short parallel
  sub-requests (`robots.txt`, `sitemap.xml`, favicon) with a 5s timeout each.
  Failures degrade to `warn` checks, never abort the audit.

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
