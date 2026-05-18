# Delta: scraper-api @ scraper-foundation

> **PRIMER spec del dominio `scraper-api`.** Delta 100% `ADDED`. Al
> ejecutar el archive equivalente, este contenido se promueve a
> `openspec/specs/scraper-api/spec.md` v0.1.0.

---

## ADDED — Capability: Audit Engine

### Propósito

Servicio HTTP en Go que recibe `POST /api/audit { url }` y devuelve un JSON
que respeta exactamente [`audit-contract`](../../../../specs/audit-contract/spec.md).
Combina 4 sub-procesos en paralelo: on-page, tracking, keywords, sentiment.

### Sub-procesos

| Sub-proceso | Archivo | Salida (campo del audit-contract) |
|-------------|---------|------------------------------------|
| **On-Page** | `internal/audit/onpage.go` | `onPage.{title,metaDescription,h1,images}` con `lengthScore` calculado. |
| **Tracking** | `internal/audit/tracking.go` | `tracking.{gtm,ga4,googleAds}` con `detected` + `ids[]` dedup. |
| **Keywords** | `internal/audit/keywords.go` | `keywords.top[]` con top 5 por densidad. |
| **Sentiment** | `internal/audit/sentiment.go` | `sentiment.{polarity,score}` con heurística ES+EN. |

### Reglas de cálculo

(Documentadas en audit-contract, replicadas aquí para enforcer.)

| Métrica | Fórmula |
|---------|---------|
| `title.lengthScore` | `clamp(1 - abs(length - 55) / 55, 0, 1)` |
| `metaDescription.lengthScore` | `clamp(1 - abs(length - 155) / 155, 0, 1)` |
| `images.altCoverage` | `withAlt / total` o `0` si `total === 0` |
| `keywords[i].density` | `count(term) / totalTokens` |
| `sentiment.score` | `(positives - negatives) / max(1, positives + negatives)` |
| `sentiment.polarity` | `'positive'` si `score >= 0.2`, `'negative'` si `score <= -0.2`, `'neutral'` resto |

### Stop-words y diccionarios sentiment

- **Stop-words**: arrays embebidos en `internal/audit/stopwords.go` (`stopwordsES`, `stopwordsEN`, ~150 términos cada uno). Cargados en sets globales en `init()`.
- **Diccionarios sentiment**: arrays embebidos en `internal/audit/sentiment_dict.go` (`positiveES`, `positiveEN`, `negativeES`, `negativeEN`, ~50-100 cada uno). Cargados en sets globales `Positives` y `Negatives` en `init()`.

### Tokenización

- Input: HTML extraído por Playwright.
- Pipeline:
  1. Remove `<script>`, `<style>`, comments con regex.
  2. Lowercase.
  3. Remove punctuation con `regexp.MustCompile(\`[^\p{L}\p{N}\s]\`)` (Unicode-aware).
  4. `strings.Fields(text)` para tokenize.
  5. Filtrar contra `StopWords` set.

### Invariantes

1. **El JSON de respuesta DEBE matchear `audit-contract` campo por campo.** Ningún campo extra. Tests integration validan contra schema.
2. **Cálculos deterministas.** Mismo input → mismo output (sentiment incluido, sin LLM).
3. **`X-Request-Id` echoed.** Si viene en request, devolver en response. Si no, generar UUID y devolverlo.

---

## ADDED — Capability: HTTP Surface

### Endpoints

| Endpoint | Method | Response | Notas |
|----------|--------|----------|-------|
| `/api/audit` | POST | 200 → `audit-contract` response. 400/408/502/500 → `{ error, message }` | Body: `{ url: string }`. |
| `/health` | GET | 200 → `{ status: "ok", playwright: bool, version: string }` | Usado por Render/Railway health checks. |

### Errores

| Status | Code (body.error) | Cuándo |
|--------|------------------|--------|
| 400 | `INVALID_URL` | URL malformada o falta. |
| 408 | `TIMEOUT` | `page.Goto` o sub-proceso excede 30s total. |
| 502 | `UPSTREAM_ERROR` | El sitio target respondió con 5xx o connection refused. |
| 500 | `INTERNAL` | Cualquier otra falla (browser pool acquire failed, etc.). |

### Headers

- Request: `Content-Type: application/json`, `X-Request-Id` (opcional).
- Response: `Content-Type: application/json`, `X-Request-Id` (echo o generado).

### CORS

- Configurable via env `ALLOWED_ORIGIN`. En dev `*`, en prod URL del dashboard.
- Methods: `POST`, `GET`, `OPTIONS`.
- Headers expuestos: `X-Request-Id`.

---

## ADDED — Capability: Browser Lifecycle

### Stack

- **playwright-community/playwright-go ^0.4400.0**.
- Chromium headless.
- Viewport 375x812 (mobile).
- User-Agent realista de Android Chrome.

### Pool

- Tamaño fijo `BROWSER_POOL_SIZE` (default 3).
- `Acquire(ctx)` bloqueante con cancelación por context.
- `Release(bc)` devuelve el context al pool.
- **No rotación implementada en mvp.** Memory growth tracked via observability (futuro).

### Timeouts

- `page.Goto`: 25s.
- Procesamiento post-extract: ≤ 5s.
- Total handler: ≤ 30s (matchea SLA del audit-contract).

### Graceful shutdown

- `signal.NotifyContext(SIGINT|SIGTERM)`.
- 10s para terminar requests in-flight.
- `pool.Close()` → cierra todos los `BrowserContext`.
- `playwright.Stop()` → mata el proceso Chromium.

---

## ADDED — Capability: Deployment

### Imagen Docker

- **Multi-stage**:
  - Builder: `golang:1.23-alpine`. `CGO_ENABLED=0` para binario estático.
  - Runtime: `mcr.microsoft.com/playwright:v1.47.0-jammy` (Chromium + deps preinstalados).
- Imagen final ~600MB.
- Runtime user: `pwuser` (non-root, preinstalado en la imagen Playwright).

### Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP port. |
| `PLAYWRIGHT_HEADLESS` | `true` | `false` en dev local para debug visual. |
| `ALLOWED_ORIGIN` | `*` | CORS allowlist. **En prod: URL exacta del dashboard.** |
| `BROWSER_POOL_SIZE` | `3` | Contextos en el pool. |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error`. |

### Plataforma sugerida

- Render free tier o Railway. Ambos manejan Dockerfile auto-detected.
- Health check path: `/health`.
- Auto-deploy on push to `main`.

---

## ADDED — Capability: Observability

### Logging estructurado

- `log/slog` (stdlib Go 1.21+) con JSON handler.
- Cada request tiene `request_id` propagado por context.
- Niveles:
  - `info`: audit start/end (`request_id`, `url`, `duration_ms`).
  - `warn`: timeouts parciales, sites con SSL inválido.
  - `error`: failures (pool acquire, page.Goto fatal, parser crash).
- **No** OpenTelemetry / Prometheus en mvp. Futuro change `scraper-observability`.

---

## Verificación

Spec satisfecha cuando ✓:

- [ ] `go build ./cmd/server` compila sin error.
- [ ] `go test ./internal/audit/...` pasa (sin tests con Chromium).
- [ ] `go test -tags playwright ./...` pasa con Chromium instalado.
- [ ] `curl localhost:8080/health` devuelve 200 con shape correcto.
- [ ] `curl -X POST localhost:8080/api/audit -d '{"url":"https://example.com"}'` devuelve JSON que valida contra `audit-contract` schema.
- [ ] Imagen Docker corre en Render free tier sin OOM con 5 requests paralelos.
- [ ] Logs son JSON parseable con `jq`.
- [ ] SIGTERM termina el proceso clean (sin zombi Chromium).

---

## Histórico de cambios

| Versión | Fecha       | Cambio | Source |
|---------|-------------|--------|--------|
| v0.1.0  | (al archivar)  | Spec inicial. ADDED Audit Engine, HTTP Surface, Browser Lifecycle, Deployment, Observability. | [`changes/archive/scraper-foundation/`](../../../changes/archive/scraper-foundation/) |
