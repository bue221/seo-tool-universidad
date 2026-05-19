# Design: woorank-checker

## Estructura Go

```
scraper-api/internal/audit/
├─ woorank.go              # API pública + orquestador
├─ woorank_checks.go       # 16 check functions
├─ woorank_test.go
└─ types.go                # extend con WoorankResult
```

## Tipos

```go
type WoorankCheckStatus string

const (
    WoorankPass WoorankCheckStatus = "pass"
    WoorankWarn WoorankCheckStatus = "warn"
    WoorankFail WoorankCheckStatus = "fail"
)

type WoorankCheck struct {
    ID       string             `json:"id"`
    Label    string             `json:"label"`     // EN, traducido en UI
    Category string             `json:"category"`  // "meta" | "headings" | "mobile" | "indexing" | "social" | "schema" | "a11y" | "security"
    Status   WoorankCheckStatus `json:"status"`
    Evidence string             `json:"evidence,omitempty"`
    Weight   float64            `json:"weight"`    // 1.0 default, 2.0 para checks críticos
}

type WoorankResult struct {
    Score  float64        `json:"score"`  // [0, 1]
    Checks []WoorankCheck `json:"checks"`
}
```

`AuditResponse.Woorank` se agrega al struct existente, con tag `json:"woorank"`.

## Orquestador

```go
func RunWoorank(ctx context.Context, page *PageContext) (*WoorankResult, error)
```

`PageContext` (ya existe o se crea en este change) agrupa:

- `URL` final tras redirects.
- `HTMLDocument *goquery.Document` (parseado una vez, reusado).
- `RawHTML string` (para JSON-LD extraction).
- `HTTPClient *http.Client` (para sub-requests).

`RunWoorank` corre 12 checks sync sobre el DOM + 4 checks async con `errgroup`:

```go
g, gctx := errgroup.WithContext(ctx)
var robots, sitemap, favicon WoorankCheck
g.Go(func() error { robots = checkRobotsTxt(gctx, page); return nil })
g.Go(func() error { sitemap = checkSitemapXml(gctx, page); return nil })
g.Go(func() error { favicon = checkFavicon(gctx, page); return nil })
// imageAltCoverage usa cálculo ya hecho en onpage.go
g.Wait()
```

Cada `check*` devuelve un `WoorankCheck` y nunca propaga error — el error se traduce a `fail` + `evidence`.

## Pesos

| Check ID | Weight | Razón |
|---|---|---|
| `title` | 2.0 | crítico SEO |
| `metaDescription` | 2.0 | crítico SEO |
| `h1Single` | 2.0 | crítico SEO |
| `https` | 2.0 | crítico security |
| `viewport` | 1.5 | mobile-first |
| `canonical` | 1.5 | indexing |
| `robotsTxt` | 1.5 | indexing |
| `sitemapXml` | 1.5 | indexing |
| `structuredData` | 1.5 | rich results |
| `imageAltCoverage` | 1.5 | a11y |
| `headingHierarchy` | 1.0 | |
| `charset` | 1.0 | |
| `langAttr` | 1.0 | |
| `favicon` | 0.5 | branding |
| `openGraph` | 1.0 | social |
| `twitterCard` | 0.5 | social |

`sum(weights) = 22.0`.

## Reglas por check

### `title`
- `<title>` ausente → `fail`, evidence "missing".
- 30 ≤ len ≤ 70 → `pass`.
- Resto → `warn`, evidence `"length: N"`.

### `metaDescription`
- ausente → `fail`.
- 70 ≤ len ≤ 160 → `pass`.
- Resto → `warn`.

### `h1Single`
- count == 1 → `pass`.
- count == 0 → `fail`.
- count > 1 → `warn`, evidence `"count: N"`.

### `headingHierarchy`
- Itera headings en orden DOM, verifica que ningún salto sea > 1 (h1→h3 = fail).
- 0 saltos malos → `pass`.
- 1–2 saltos → `warn`.
- 3+ saltos → `fail`.

### `viewport`
- presente con `width=device-width` → `pass`.
- presente sin `width=device-width` → `warn`.
- ausente → `fail`.

### `charset`
- `<meta charset="UTF-8">` (case-insensitive) → `pass`.
- otro charset → `warn`.
- ausente → `fail`.

### `https`
- URL final empieza con `https://` → `pass`.
- otro → `fail`.

### `langAttr`
- `<html lang="xx">` con valor → `pass`.
- vacío → `warn`.
- ausente → `fail`.

### `canonical`
- `<link rel="canonical" href="…">` con href absoluto → `pass`.
- href relativo → `warn`.
- ausente → `fail`.

### `robotsTxt`
- GET `{origin}/robots.txt`, timeout 5s.
- 200 + body no contiene `User-agent: *\nDisallow: /` → `pass`.
- 200 + Disallow: / global → `warn`, evidence `"site blocks all crawlers"`.
- 4xx/5xx/timeout → `warn`, evidence `"unreachable"`.

### `sitemapXml`
- GET `{origin}/sitemap.xml`, timeout 5s.
- 200 + body contiene `<urlset` o `<sitemapindex` → `pass`.
- otro → `warn`.
- Importante: NO seguir el sitemap, solo verificar que existe.

### `favicon`
- `<link rel="icon">` con href válido O HEAD `{origin}/favicon.ico` 200 → `pass`.
- ninguno → `warn`.

### `openGraph`
- `og:title` + `og:description` + `og:image` → `pass`.
- 1–2 de los 3 → `warn`, evidence lista los missing.
- 0 → `fail`.

### `twitterCard`
- `twitter:card` presente con valor `summary` / `summary_large_image` / `app` / `player` → `pass`.
- presente con otro valor → `warn`.
- ausente → `fail`.

### `structuredData`
- Al menos un `<script type="application/ld+json">` con `json.Valid` true → `pass`.
- presente pero inválido → `warn`, evidence `"invalid JSON-LD"`.
- ausente → `fail`.

### `imageAltCoverage`
- Reusa `onPage.images.altCoverage` ya calculado.
- ≥ 0.9 → `pass`. ≥ 0.7 → `warn`. < 0.7 → `fail`.

## UI

### `WoorankSection.tsx`

```tsx
<Card>
  <CardHeader>
    <CardTitle>WooRank Score</CardTitle>
    <ScoreRing value={result.score} />  {/* SVG circular, color por threshold */}
  </CardHeader>
  <CardContent>
    <Accordion>
      {groupedByCategory.map((cat) => (
        <AccordionItem key={cat.id}>
          <AccordionTrigger>
            {cat.label} <Badge>{cat.passed}/{cat.total}</Badge>
          </AccordionTrigger>
          <AccordionContent>
            {cat.checks.map(c => (
              <CheckRow status={c.status} label={t(c.id)} evidence={c.evidence} />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </CardContent>
</Card>
```

Color del ring:
- `score ≥ 0.85` → verde.
- `0.6 ≤ score < 0.85` → ámbar.
- `< 0.6` → rojo.

## Spec del contrato — delta v0.2.0

```jsonc
{
  // … campos v0.1.0 …
  "woorank": {
    "score": 0.78,
    "checks": [
      {
        "id": "title",
        "label": "Title tag length",
        "category": "meta",
        "status": "pass",
        "weight": 2.0
      },
      {
        "id": "sitemapXml",
        "label": "sitemap.xml available",
        "category": "indexing",
        "status": "warn",
        "evidence": "unreachable",
        "weight": 1.5
      }
      // … 14 más
    ]
  }
}
```

## Testing

- Fixture por check en `internal/audit/testdata/woorank/`.
- `httptest.Server` para robots/sitemap/favicon → respuestas controladas.
- Test de determinismo: mismo input → mismo score.

## Migración / compatibilidad

- Aditivo. Clients viejos que no leen `woorank` siguen funcionando.
- `dashboard-web` renderiza `WoorankSection` solo si `payload.woorank != null` → backwards compat con snapshots viejos.
