# Design: scraper-foundation

**Scope:** Cómo construimos el motor Go del scraper, con qué libs, qué estructura de paquetes, cómo manejamos Chromium y qué estrategias usamos para tokenización y sentiment.

---

## 1. Decisiones de libs

| Capa | Elección | Alternativas descartadas | Por qué |
|------|----------|--------------------------|---------|
| HTTP framework | **Fiber v2** | `net/http`, gin, echo, chi | Fiber es rápido (Fasthttp under), API tipo Express familiar, builtins de CORS + recovery + logger. Para mvp académico, devex pesa. |
| Headless browser | **playwright-community/playwright-go** | chromedp, rod | Playwright tiene la API más madura para extraer HTML post-JS. `playwright-go` mantiene paridad con la oficial. `chromedp` es más bajo nivel; `rod` es más reciente pero menos documentado. |
| Logging | **`log/slog`** (lib estándar Go 1.21+) | logrus, zap | `slog` es stdlib desde Go 1.21. JSON handler out-of-the-box. Cero deps. |
| Routing de ENV | **`os.Getenv` + helpers** | viper, godotenv | mvp no necesita ese overhead. Validación manual + valores default en código. |
| Testing HTTP | **`net/http/httptest`** | testify suite, ginkgo | Lib estándar; integración perfecta con Fiber's `app.Test()`. |
| HTML parsing | **`golang.org/x/net/html`** (lo que Playwright extrae ya viene parseado, pero para queries adicionales) | goquery (jQuery-like) | Playwright-go expone DOM via JS evals — no necesitamos parseo Go-side intensivo. Si hace falta para algo específico, `goquery`. |

## 2. Estructura de paquetes

```
scraper-api/
├── cmd/
│   └── server/
│       └── main.go                  # Entry: setup, routes, graceful shutdown
├── internal/
│   ├── audit/
│   │   ├── handler.go               # POST /api/audit Fiber handler
│   │   ├── runner.go                # Orquesta los 4 sub-procesos con WaitGroup
│   │   ├── types.go                 # Structs matching audit-contract
│   │   ├── onpage.go                # title, meta, h1, alt coverage
│   │   ├── onpage_test.go
│   │   ├── tracking.go              # GTM/GA4/Ads regex
│   │   ├── tracking_test.go
│   │   ├── keywords.go              # tokenize + stopwords + density
│   │   ├── keywords_test.go
│   │   ├── sentiment.go             # heurística diccionario
│   │   ├── sentiment_test.go
│   │   ├── stopwords.go             # arrays ES + EN embebidos
│   │   └── sentiment_dict.go        # arrays positive/negative ES + EN
│   ├── browser/
│   │   ├── playwright.go            # Pool de BrowserContext (N=3)
│   │   └── playwright_test.go
│   ├── health/
│   │   └── handler.go               # GET /health
│   ├── httpx/
│   │   ├── middleware.go            # CORS, request_id, slog
│   │   └── errors.go                # Mapping a códigos del audit-contract
│   └── config/
│       └── config.go                # ENV parsing + defaults
├── go.mod
├── go.sum
├── Dockerfile
├── .dockerignore
└── README.md
```

## 3. `go.mod` (deps esperadas)

```
module github.com/cplaza/seo-custom-tool/scraper-api

go 1.23

require (
    github.com/gofiber/fiber/v2 v2.52.0
    github.com/google/uuid v1.6.0
    github.com/playwright-community/playwright-go v0.4400.0
    golang.org/x/net v0.30.0
)
```

## 4. Tipos que matchean el audit-contract

```go
// internal/audit/types.go
package audit

type Request struct {
    URL string `json:"url"`
}

type Response struct {
    URL       string         `json:"url"`
    FetchedAt string         `json:"fetchedAt"`
    OnPage    OnPage         `json:"onPage"`
    Tracking  Tracking       `json:"tracking"`
    Keywords  Keywords       `json:"keywords"`
    Sentiment Sentiment      `json:"sentiment"`
}

type OnPage struct {
    Title           ValueScored `json:"title"`
    MetaDescription ValueScored `json:"metaDescription"`
    H1              H1Info      `json:"h1"`
    Images          ImagesInfo  `json:"images"`
}

type ValueScored struct {
    Value       string  `json:"value"`
    LengthScore float64 `json:"lengthScore"`
}

type H1Info struct {
    Count int    `json:"count"`
    Value string `json:"value"`
}

type ImagesInfo struct {
    Total       int     `json:"total"`
    WithAlt     int     `json:"withAlt"`
    AltCoverage float64 `json:"altCoverage"`
}

type Tracking struct {
    GTM       TrackEntry `json:"gtm"`
    GA4       TrackEntry `json:"ga4"`
    GoogleAds TrackEntry `json:"googleAds"`
}

type TrackEntry struct {
    Detected bool     `json:"detected"`
    IDs      []string `json:"ids"`
}

type Keywords struct {
    Top []KeywordEntry `json:"top"`
}

type KeywordEntry struct {
    Term    string  `json:"term"`
    Density float64 `json:"density"`
}

type Sentiment struct {
    Polarity string  `json:"polarity"` // positive|neutral|negative
    Score    float64 `json:"score"`
}

type ErrorResponse struct {
    Error   string `json:"error"`
    Message string `json:"message"`
}
```

## 5. Flujo del handler

```
        ┌─────────────────────────────┐
        │  POST /api/audit            │
        │  body: { url }              │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  Validate URL               │
        │  (http/https, length ≤2000) │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  Get BrowserContext         │
        │  from pool (blocking)       │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  ctx.NewPage()              │
        │  page.Goto(url, t=25s)      │
        │  Extract HTML + title +     │
        │  meta + h1 + images via JS  │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  runner.Run(data)           │
        │   - go onpage.Analyze()     │
        │   - go tracking.Detect()    │
        │   - go keywords.Top(...)    │
        │   - go sentiment.Score(...) │
        │   sync.WaitGroup.Wait()     │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  Build Response struct      │
        │  page.Close()               │
        │  return context to pool     │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  c.JSON(200, response)      │
        │  log info (request_id, ms)  │
        └─────────────────────────────┘
```

## 6. Browser pool

```go
// internal/browser/playwright.go (simplificado)
type Pool struct {
    contexts chan playwright.BrowserContext
    browser  playwright.Browser
}

func NewPool(size int) (*Pool, error) {
    pw, _ := playwright.Run()
    browser, _ := pw.Chromium.Launch(...)
    pool := &Pool{
        contexts: make(chan playwright.BrowserContext, size),
        browser:  browser,
    }
    for i := 0; i < size; i++ {
        ctx, _ := browser.NewContext(playwright.BrowserNewContextOptions{
            UserAgent: ptr("Mozilla/5.0 (Linux; Android 13)..."),
            Viewport: &playwright.Size{ Width: 375, Height: 812 },
        })
        pool.contexts <- ctx
    }
    return pool, nil
}

func (p *Pool) Acquire(ctx context.Context) (playwright.BrowserContext, error) {
    select {
    case bc := <-p.contexts:
        return bc, nil
    case <-ctx.Done():
        return nil, ctx.Err()
    }
}

func (p *Pool) Release(bc playwright.BrowserContext) {
    p.contexts <- bc
}
```

**Tradeoff documentado:** pool fijo N=3. Si llegan 4 requests paralelos, el 4to espera hasta que se libere uno. Pro: memoria predecible (~750MB para 3 contexts). Contra: latencia variable bajo carga.

**Recycling:** cada N=100 audits el context se cierra y se recrea, para liberar memoria potencial. Implementación opcional en mvp; documentado como "rotación" futura.

## 7. Sub-procesos

### 7.1 onpage.go

```go
// Inputs vienen extraídos via page.Evaluate() en el handler:
//   - title: page.Title()
//   - metaDescription: page.GetAttribute('meta[name=description]', 'content')
//   - h1Elements: page.QuerySelectorAll('h1') → count + text del primero
//   - images: page.QuerySelectorAll('img') → total + count(alt != "")
//
// onpage.Analyze(raw) → OnPage struct con lengthScore calculado según audit-contract.
```

Fórmulas (según audit-contract):

- `title.lengthScore = clamp(1 - |length - 55| / 55, 0, 1)`
- `metaDescription.lengthScore = clamp(1 - |length - 155| / 155, 0, 1)`
- `images.altCoverage = withAlt / total` (0 si total = 0).

### 7.2 tracking.go

```go
var (
    gtmRegex    = regexp.MustCompile(`googletagmanager\.com/gtm\.js\?id=(GTM-[A-Z0-9]+)`)
    ga4Regex    = regexp.MustCompile(`gtag\('config',\s*'(G-[A-Z0-9]{6,})'\)`)
    adsRegex    = regexp.MustCompile(`googleads\.g\.doubleclick\.net|google_ad_client`)
)
```

Cada función devuelve `TrackEntry{ Detected, IDs }`. IDs deduplicados con `map[string]struct{}`.

### 7.3 keywords.go

1. Limpia HTML → texto plano (remover scripts, styles, comments).
2. Lowercase + remove punctuation con `regexp.MustCompile(`[^\p{L}\p{N}\s]`)`.
3. Tokenize por espacios (Unicode-aware con `strings.Fields`).
4. Filtra stop-words ES+EN (combinado en un single `map[string]struct{}` para O(1) lookup).
5. Conta ocurrencias.
6. `density = count / totalTokens`.
7. Devuelve top 5 por density.

### 7.4 sentiment.go

Algoritmo:

```
positives = count(token in positiveES ∪ positiveEN)
negatives = count(token in negativeES ∪ negativeEN)

if positives + negatives == 0:
    score = 0
else:
    score = (positives - negatives) / (positives + negatives)

polarity = 'positive' si score >= 0.2
         = 'negative' si score <= -0.2
         = 'neutral'  otherwise
```

Diccionarios embebidos como Go arrays (no `embed.FS` para mvp). Se inicializan en `init()` a sets para O(1) lookup.

## 8. CORS y middleware

```go
// internal/httpx/middleware.go
app.Use(cors.New(cors.Config{
    AllowOrigins:  config.AllowedOrigin,         // "*" en dev, URL en prod
    AllowMethods:  "POST,GET,OPTIONS",
    AllowHeaders:  "Content-Type,X-Request-Id",
    ExposeHeaders: "X-Request-Id",
}))

app.Use(func(c *fiber.Ctx) error {
    rid := c.Get("X-Request-Id")
    if rid == "" {
        rid = uuid.NewString()
    }
    c.Set("X-Request-Id", rid)
    c.Locals("request_id", rid)
    return c.Next()
})

app.Use(slogMiddleware)  // log start + duration con request_id
```

## 9. Graceful shutdown

```go
// cmd/server/main.go
ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
defer stop()

app := fiber.New(...)
// ... routes ...

go func() {
    if err := app.Listen(":" + config.Port); err != nil {
        slog.Error("listen failed", "err", err)
    }
}()

<-ctx.Done()
slog.Info("shutdown signal received")

shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
app.ShutdownWithContext(shutdownCtx)
pool.Close()  // cierra browser contexts
playwright.Stop()
slog.Info("shutdown complete")
```

## 10. Dockerfile

```dockerfile
# === Builder ===
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/server ./cmd/server

# === Runtime ===
# Imagen oficial de Playwright con Chromium + system deps preinstalados.
FROM mcr.microsoft.com/playwright:v1.47.0-jammy AS runtime
WORKDIR /app
COPY --from=builder /bin/server /app/server

ENV PORT=8080
ENV PLAYWRIGHT_HEADLESS=true
EXPOSE 8080

# Drop privileges
USER pwuser

CMD ["/app/server"]
```

**Tradeoff:** imagen ~600MB. Comparado con `alpine + manual deps` (que requiere instalar libxshmfence1, libdrm2, etc.), la imagen oficial es robusta y mantenida.

## 11. ENV vars

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `8080` | Port HTTP. |
| `PLAYWRIGHT_HEADLESS` | `true` | `false` en dev para debugging visual. |
| `ALLOWED_ORIGIN` | `*` | CORS allowlist. En prod: URL completa del dashboard. |
| `BROWSER_POOL_SIZE` | `3` | Tamaño del pool. |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error`. |

## 12. Tradeoffs aceptados

- **Pool fijo en vez de elástico:** memoria predecible vs latencia bajo carga. Documentado.
- **Diccionarios embebidos en código:** menos flexibilidad para extender, pero cero IO. Si crecen >500 términos por diccionario, mover a `embed.FS`.
- **No HTTP/2 / TLS termination:** Render/Railway lo hacen. Sirve HTTP plano.
- **No graceful drain por request:** ShutdownWithContext espera 10s; si una request en curso no termina, se trunca. Aceptable para mvp.
- **No retries internos:** el dashboard hace el retry si quiere.
- **`X-Request-Id` echoeado pero no validado:** confianza en el caller. Si viene malformado, lo pisamos con un UUID nuevo.

## 13. Plan de rollout

1. Bootstrap local con `go run ./cmd/server`. Smoke con `curl localhost:8080/health`.
2. Auditar `https://example.com` localmente con `curl -X POST :8080/api/audit -d '{"url":"https://example.com"}'`.
3. Verificar shape contra audit-contract con `jq` o un test integración.
4. Build Docker imagen, push a registry, deploy a Render free tier.
5. Update `SCRAPER_API_URL` en dashboard-web env vars.
6. Smoke desde el dashboard real.
