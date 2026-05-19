# Delta scraper-api: woorank-checker

**Target spec:** `openspec/specs/scraper-api/spec.md` (no existe aún — este change INICIALIZA la sección WooRank).
**Operación:** ADD

---

## ADDED — Módulo WooRank

### Módulo Go

```
scraper-api/internal/audit/
├─ woorank.go
├─ woorank_checks.go
└─ woorank_test.go
```

### API pública

```go
func RunWoorank(ctx context.Context, page *PageContext) (*WoorankResult, error)
```

- Idempotente: mismo HTML/origin → mismo resultado.
- Nunca panic; errores de fetch se traducen a `status: "fail"` con `evidence: "unreachable"`.
- Ejecuta sub-requests (robots, sitemap, favicon) en paralelo vía `errgroup.WithContext` con timeout 5s por request.

### Integración en runner

`runner.Run(ctx, url)` invoca `RunWoorank` en paralelo a los runners existentes (onpage, tracking, keywords, sentiment) usando el mismo `PageContext` con el DOM ya parseado por Playwright. Sin re-fetch del HTML principal.

### PageContext (nuevo, si no existe)

Estructura compartida entre runners:

- `URL` — URL final tras redirects.
- `Document *goquery.Document` — DOM parseado una sola vez.
- `RawHTML string` — para extracciones tipo `<script type="application/ld+json">`.
- `HTTPClient *http.Client` — cliente con timeout configurable, reusado por sub-requests.

### Testing

- Test fixtures HTML en `internal/audit/testdata/woorank/`.
- Sub-requests cubiertos con `httptest.Server`.
- Test de determinismo del score agregado.
- `go vet` y `go test ./internal/audit/...` deben pasar.

### Observabilidad

- Log estructurado por check: `{checkId, status, durationMs}` en nivel debug.
- Métrica agregada: tiempo total de `RunWoorank` en histograma.
