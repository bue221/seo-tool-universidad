# Proposal: scraper-foundation

**Domain:** `scraper-api` (PRIMER change de este dominio)
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-18
**Depends on:** [`audit-contract`](../../specs/audit-contract/spec.md) (active) — el JSON que devolvemos.

---

## ¿Por qué?

El dominio `scraper-api` solo existe hoy como un README, un `agents.md` y un `go.mod` vacío. Necesitamos materializar el motor: un servicio HTTP en Go que ejecuta auditoría on-page, detección de tracking, análisis de keywords y sentiment, y devuelve un JSON que respeta exactamente el [`audit-contract`](../../specs/audit-contract/spec.md).

Sin esto, `audit-runner` (el feature de dashboard) no tiene a quién consultar. PageSpeed solo cubre métricas de Google; el resto del valor del proyecto (WooRank-style auditoría, SemRush-style keywords, sentiment) vive aquí.

Este es **el primer change que pisa el dominio `scraper-api`** — el delta es 100% `ADDED`.

## ¿Qué?

### Alcance (in-scope)

1. **Bootstrap del módulo Go** en `scraper-api/`:
   - `go.mod` con deps reales (Fiber v2, playwright-go).
   - Estructura `cmd/server/` + `internal/`.
   - `go.sum` post-`go mod tidy`.

2. **Endpoint principal `POST /api/audit`**:
   - Body: `{ "url": "https://..." }`.
   - Response: JSON que matchea [`audit-contract`](../../specs/audit-contract/spec.md) **campo por campo**.
   - Errores con códigos definidos en audit-contract (`INVALID_URL`, `TIMEOUT`, `UPSTREAM_ERROR`, `INTERNAL`).
   - Header `X-Request-Id` echo si viene del cliente.
   - Timeout duro 30s por audit (matchea SLA).

3. **Endpoint `GET /health`**:
   - Response: `{ "status": "ok", "playwright": true, "version": "v0.1.0" }`.
   - Usado por Render/Railway para health checks.

4. **Runner orquestador** en `internal/audit/runner.go`:
   - Recibe HTML renderizado + URL.
   - Ejecuta **en paralelo con goroutines** los 4 sub-procesos.
   - `sync.WaitGroup` + canales para sincronizar.
   - Cierra browser context al final.

5. **Sub-procesos** (cada uno con su archivo y tests):
   - `internal/audit/onpage.go` — title, meta, h1, alt coverage.
   - `internal/audit/tracking.go` — GTM/GA4/Ads via regex.
   - `internal/audit/keywords.go` — tokenize → stop-word filter → top 5 density.
   - `internal/audit/sentiment.go` — heurística con diccionarios embebidos.

6. **Browser lifecycle** (`internal/browser/playwright.go`):
   - Pool de N=3 `BrowserContext` reutilizados entre requests.
   - Cada audit hace `context.NewPage()`, navega, extrae HTML, cierra page.
   - Chromium headless, viewport mobile (375x812), user-agent realista.
   - Timeout por page.Goto: 25s (deja 5s para procesamiento).

7. **Stop-words embebidos**: `internal/audit/stopwords.go` con arrays `stopwordsES`, `stopwordsEN` (~150 cada uno). No archivos externos para mvp.

8. **Diccionarios sentiment embebidos**: `internal/audit/sentiment_dict.go` con `positiveES`, `positiveEN`, `negativeES`, `negativeEN` (50-100 términos cada uno).

9. **Logging estructurado** con `log/slog` (lib estándar Go 1.21+):
   - JSON output.
   - `request_id` propagado por context.
   - Niveles: `info` (audit start/end), `warn` (timeouts parciales), `error` (failures).

10. **Graceful shutdown** con `signal.NotifyContext` (SIGINT/SIGTERM):
    - Termina requests in-flight.
    - Cierra Playwright browser cleanly.

11. **CORS** con whitelist:
    - En prod: solo el `NEXT_PUBLIC_SITE_URL` del dashboard (env `ALLOWED_ORIGIN`).
    - En dev: `*`.

12. **Tests**:
    - Unit por sub-proceso (mock HTML input).
    - Integración con `httptest` para el handler completo.

13. **Dockerfile multi-stage**:
    - Builder: `golang:1.23-alpine`.
    - Runtime: `mcr.microsoft.com/playwright:v1.47.0-jammy` (trae Chromium + system deps).
    - Imagen final ~600MB (aceptable para Render/Railway).

14. **README** en `scraper-api/README.md` actualizado con quickstart real (build, run, deploy).

### No-objetivos (out-of-scope explícito)

- **No** cache de resultados. Cada request es fresh.
- **No** proxy rotation / anti-bot — usamos user-agent realista pero no esquivamos detección activamente.
- **No** screenshots — solo HTML extraction.
- **No** auth en el endpoint — confiar en que el caller es `dashboard-web` detrás de Vercel + ALLOWED_ORIGIN.
- **No** métricas Prometheus / OpenTelemetry — futuro change `scraper-observability`.
- **No** rate limiting interno — Render/Railway manejan eso a nivel infra.
- **No** queue / async jobs — todo sincrónico, request-response.
- **No** scraping de URLs JavaScript-heavy con interacciones complejas (form submit, scroll-to-load) — Playwright renderiza el initial load nomás.
- **No** soporte multi-locale del sentiment más allá de ES+EN.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Chromium boot lento (~3s) por audit | Pool de 3 BrowserContext reutilizados. Tradeoff: memoria (~250MB por context) vs latencia. |
| Sitio target con JS-heavy hace que `domcontentloaded` tarde 30s | Timeout duro 25s en `page.Goto`. Si excede, devuelve `TIMEOUT`. |
| Memoria que crece (Chromium leaks páginas) | `context.Close()` cada N=100 audits (rotate del pool). Documentar. |
| Sitio que detecta bot y responde con captcha | Aceptamos el resultado del audit (el captcha aparecerá como contenido HTML). El sentiment quizás cuente "captcha" como negativo — aceptable. |
| Diccionarios embebidos quedan stale | Hardcoded en mvp. Si crecen las palabras, mover a archivo JSON `go:embed`. |
| Imagen Docker muy grande (~600MB) | Aceptado — Playwright requiere Chromium completo. Alternativa (`alpine + manual deps`) es pesadilla de mantenimiento. |
| Crash de Playwright deja procesos zombi | `signal.NotifyContext` + `defer` cierre del browser. Documentado. |
| Concurrencia: 10 requests paralelos solicitan los 3 contexts | El pool se serializa: 4to request espera. Es un trade-off de latencia vs memoria. Sub-óptimo pero mvp. |

## Métricas de éxito

- p50 ≤ 6s, p95 ≤ 15s en sitios típicos (matchea SLA del audit-contract).
- Cero respuestas con shape distinto al audit-contract (validado contra schema).
- `GET /health` responde < 200ms.
- 0 procesos zombi después de SIGTERM (verificado con `ps`).
- Imagen Docker corre en Render free tier con < 1GB RAM bajo 5 requests paralelos.
- Tests unit + integration ≥ 80% coverage en `internal/audit/`.

## Referencias

- [`audit-contract`](../../specs/audit-contract/spec.md) v0.1.0 — el contrato que respetamos campo por campo.
- Playwright-Go: https://github.com/playwright-community/playwright-go
- Fiber v2: https://docs.gofiber.io/
