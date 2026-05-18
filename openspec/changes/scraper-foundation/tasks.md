# Tasks: scraper-foundation

> Marcar `[x]` al completar. Bloqueado por red para `go mod tidy` y deploy.

---

## 0. Bootstrap del módulo Go

- [ ] Editar `scraper-api/go.mod` agregando deps esperadas (sin versions resueltas — `go mod tidy` lo hace).
- [ ] Crear estructura de carpetas:
  - `cmd/server/`
  - `internal/audit/`
  - `internal/browser/`
  - `internal/health/`
  - `internal/httpx/`
  - `internal/config/`
- [ ] Cuando haya red: `cd scraper-api && go mod tidy`.

## 1. Tipos del audit-contract

- [ ] `internal/audit/types.go` con structs `Request`, `Response`, `OnPage`, `ValueScored`, `H1Info`, `ImagesInfo`, `Tracking`, `TrackEntry`, `Keywords`, `KeywordEntry`, `Sentiment`, `ErrorResponse`.
- [ ] JSON tags exactamente como audit-contract.spec.md.

## 2. Stop-words y diccionarios

- [ ] `internal/audit/stopwords.go` con `stopwordsES []string` (~150 términos) y `stopwordsEN []string` (~150).
- [ ] `init()` que carga ambos en un `map[string]struct{}` global `StopWords` para O(1) lookup.
- [ ] `internal/audit/sentiment_dict.go` con `positiveES`, `positiveEN`, `negativeES`, `negativeEN` (50-100 cada uno).
- [ ] `init()` que carga en sets `Positives` y `Negatives` (combinando ES+EN).

## 3. Sub-procesos

### 3.1 on-page
- [ ] `internal/audit/onpage.go` — `Analyze(raw OnPageRaw) OnPage` con lengthScore según audit-contract.
- [ ] Tests `onpage_test.go` con casos: title corto/óptimo/largo; meta corto/óptimo/largo; h1 ausente/único/múltiple; alt coverage 0/partial/full.

### 3.2 tracking
- [ ] `internal/audit/tracking.go` — `Detect(html string) Tracking` con regex GTM/GA4/Ads + dedup IDs.
- [ ] Tests `tracking_test.go`: HTML con GTM presente, GA4 presente, Ads presente, todos ausentes, IDs duplicados.

### 3.3 keywords
- [ ] `internal/audit/keywords.go`:
  - `extractText(html string) string` — remueve script/style/comments, lowercase, removes punct.
  - `tokenize(text string) []string` — Unicode-aware con `strings.Fields` + `unicode.IsLetter/IsNumber`.
  - `Top(html string, n int) Keywords` — pipeline completo.
- [ ] Tests `keywords_test.go`: texto vacío, texto con solo stop-words, texto con keywords claras.

### 3.4 sentiment
- [ ] `internal/audit/sentiment.go` — `Score(tokens []string) Sentiment` con fórmula del audit-contract.
- [ ] Tests `sentiment_test.go`: texto puro positivo, puro negativo, balanceado, sin matches → neutral 0.

## 4. Runner orquestador

- [ ] `internal/audit/runner.go`:
  - `Run(ctx, raw) (Response, error)`.
  - Lanza 4 goroutines.
  - `sync.WaitGroup` + canales para cada resultado.
  - Honra `ctx.Done()` para cancelación.

## 5. Browser pool

- [ ] `internal/browser/playwright.go`:
  - `NewPool(size int) (*Pool, error)`.
  - `Acquire(ctx) (BrowserContext, error)` con bloqueo + cancelación.
  - `Release(bc)`.
  - `Close()` que cierra todos los contexts + browser + Playwright runtime.
- [ ] Tests `playwright_test.go`: build pool tamaño 1, acquire/release loop, timeout en acquire si pool vacío.
- [ ] Documentar: NO correr tests en CI sin Chromium instalado; flagear con `//go:build playwright`.

## 6. Handler `/api/audit`

- [ ] `internal/audit/handler.go`:
  - Parse body `{ url }`.
  - Validar URL (http/https, length).
  - `pool.Acquire(ctx)`.
  - `bc.NewPage()`, `page.Goto(url, timeout=25s)`.
  - `page.Evaluate()` para extraer title/meta/h1/images/HTML.
  - `runner.Run(...)`.
  - `page.Close()`, `pool.Release(bc)`.
  - `c.JSON(200, response)`.
  - Error mapping a códigos del audit-contract.

## 7. Health endpoint

- [ ] `internal/health/handler.go` — `GET /health` devuelve `{ status: "ok", playwright: bool, version: string }`.

## 8. Middleware

- [ ] `internal/httpx/middleware.go`:
  - CORS configurable con `ALLOWED_ORIGIN`.
  - Request ID middleware (echo X-Request-Id o genera UUID).
  - slog logger middleware (start + duration + status).
- [ ] `internal/httpx/errors.go`:
  - `Error(c *fiber.Ctx, status int, code, message string)` — devuelve shape del audit-contract.

## 9. Config

- [ ] `internal/config/config.go` con struct `Config` y `Load()`:
  - `PORT` (default 8080).
  - `PLAYWRIGHT_HEADLESS` (default true).
  - `ALLOWED_ORIGIN` (default `*`).
  - `BROWSER_POOL_SIZE` (default 3).
  - `LOG_LEVEL` (default info).

## 10. Entry point

- [ ] `cmd/server/main.go`:
  - Load config.
  - Init slog (JSON handler).
  - Init browser pool.
  - Setup Fiber app + middleware + routes.
  - `signal.NotifyContext` para SIGINT/SIGTERM.
  - Graceful shutdown con timeout 10s.

## 11. Integration tests

- [ ] `cmd/server/server_test.go` o `internal/audit/handler_integration_test.go`:
  - Bootstrap minimal del app.
  - `app.Test()` con request a `/health` → 200.
  - `app.Test()` con request a `/api/audit` body válido → 200 + shape correcto.
  - URL inválida → 400 con `error: INVALID_URL`.
  - Mock del browser pool si Chromium no disponible.

## 12. Dockerfile

- [ ] `scraper-api/Dockerfile` multi-stage según design.md.
- [ ] `scraper-api/.dockerignore` (excluir `.git`, `*_test.go`, etc.).
- [ ] Test local: `docker build -t scraper-api . && docker run -p 8080:8080 scraper-api`.

## 13. README

- [ ] Actualizar `scraper-api/README.md`:
  - Quickstart real (Go install, go mod tidy, playwright install, go run).
  - Cómo correr tests.
  - Variables de entorno documentadas.
  - Deploy a Render/Railway: pasos básicos.
  - Troubleshooting (Chromium no instalado, etc.).

## 14. Deploy

- [ ] Crear Render web service (o Railway):
  - Conectar repo o subir Dockerfile.
  - ENV vars: `ALLOWED_ORIGIN` = URL del dashboard de prod.
  - Health check path: `/health`.
- [ ] Smoke desde curl: `curl https://<service>.onrender.com/health`.
- [ ] Actualizar `SCRAPER_API_URL` en `.env.local.example` del dashboard.

## 15. Cierre

- [ ] PR título: `feat(scraper): Go + Fiber + Playwright bootstrap [scraper-foundation]`.
- [ ] Validar specs: review manual del delta.
- [ ] Archive offline:
  - Promover delta a `openspec/specs/scraper-api/spec.md` (v0.1.0 — primer spec del dominio).
  - Mover a `openspec/changes/archive/scraper-foundation/`.
- [ ] Actualizar `openspec/README.md` y `AGENTS.md` raíz con la nueva spec activa de `scraper-api`.
