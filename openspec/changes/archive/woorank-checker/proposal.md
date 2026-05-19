# Proposal: woorank-checker

**Domain:** `audit-contract` (+ `scraper-api` + `dashboard-web`)
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-19
**Depends on:**
- [`scraper-foundation`](../scraper-foundation/) — el módulo Go ya carga HTML con Playwright.
- [`audit-runner`](../audit-runner/) — UI consumidora.

---

## ¿Por qué?

El enunciado y `AGENTS.md` mencionan **WooRank** como herramienta SEO. WooRank es comercial; replicamos el subset técnico verificable de su checklist on-page con análisis estático del HTML ya cargado por el scraper. No agrega overhead de red porque reutiliza el DOM que Playwright ya tiene en memoria.

Beneficio adicional: convertimos los chequeos individuales en una **puntuación agregada** que el dashboard puede mostrar al lado del PageSpeed score → narrativa de "rendimiento Google + higiene SEO técnica".

## ¿Qué?

### Alcance (in-scope)

1. **Módulo Go nuevo** `scraper-api/internal/audit/woorank.go` con 16 chequeos:

   | ID | Categoría | Verifica |
   |---|---|---|
   | `title` | Meta | `<title>` presente, 30–70 chars |
   | `metaDescription` | Meta | `<meta name="description">` presente, 70–160 chars |
   | `h1Single` | Headings | Exactamente 1 `<h1>` |
   | `headingHierarchy` | Headings | No saltos (h1→h2, h2→h3) |
   | `viewport` | Mobile | `<meta name="viewport" content="width=device-width…">` |
   | `charset` | Encoding | `<meta charset>` UTF-8 |
   | `https` | Security | URL final `https://` |
   | `langAttr` | i18n | `<html lang="…">` no vacío |
   | `canonical` | Indexing | `<link rel="canonical">` presente |
   | `robotsTxt` | Indexing | `GET /robots.txt` → 200 + no `Disallow: /` global |
   | `sitemapXml` | Indexing | `GET /sitemap.xml` → 200 con `<urlset>` |
   | `favicon` | Branding | `<link rel="icon">` o `/favicon.ico` accesible |
   | `openGraph` | Social | `og:title`, `og:description`, `og:image` presentes |
   | `twitterCard` | Social | `twitter:card` presente |
   | `structuredData` | Schema | Al menos un `<script type="application/ld+json">` con JSON válido |
   | `imageAltCoverage` | Accesibilidad | `altCoverage ≥ 0.8` (reutiliza cálculo existente) |

2. **Spec bump del contrato** a v0.2.0 (aditivo). Nuevo bloque `woorank` en response.

3. **Score agregado** `woorank.score ∈ [0, 1]`:
   - `pass = 1`, `warn = 0.5`, `fail = 0`.
   - `score = sum(weights × outcome) / sum(weights)` con pesos definidos en `design.md`.

4. **Sub-requests adicionales** desde Playwright: `robots.txt`, `sitemap.xml`, favicon HEAD. Timeout cada uno 5s, fallo silencioso → `fail` con `evidence: "fetch failed"`.

5. **UI dashboard-web** — sección nueva en `/audit/[snapshotId]`:
   - Card grande "WooRank Score: 0.78" con ring SVG.
   - Lista colapsable agrupada por categoría: cada check con icono pass/warn/fail + `evidence` cuando aplique.
   - Componente `WoorankSection.tsx` al lado de `PageSpeedSection.tsx`.

6. **Persistencia**: el bloque `woorank` viaja dentro del payload jsonb de `seo_snapshots`. Sin migración.

7. **Tests Go**:
   - `woorank_test.go` con HTML fixtures por cada check (pass/warn/fail).
   - Tests para `robotsTxt`/`sitemapXml` usando `httptest.Server`.

### No-objetivos

- **No** réplica visual del producto WooRank.
- **No** análisis off-page (backlinks, autoridad de dominio).
- **No** auditoría de performance — eso lo cubre PageSpeed.
- **No** parseo de robots.txt avanzado (solo "tiene contenido y no es deny-all").
- **No** validación de schema.org (solo "JSON-LD parseable").
- **No** scoring ponderado custom por usuario — pesos fijos en v0.2.0.
- **No** sugerencias automáticas tipo "tu título mide 25 chars, sumá 5 más" — solo pass/warn/fail con `evidence`.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| 4 sub-requests adicionales suben latencia | Disparar en paralelo con `errgroup`. Cada uno con timeout 5s. p95 esperado +2s sobre baseline. |
| Sitios bloquean robots.txt con 403 | Tratar como `warn` (no `fail`), evidence = "blocked". |
| JSON-LD malformado revienta el parser | `json.Valid` en lugar de `Unmarshal` → boolean rápido sin allocar struct. |
| Cambio breaking del contrato si alguien deserializa estricto | Cambio es aditivo. Documentar en `audit-contract` que clients ignoran fields desconocidos. |
| UI rompe si scrapers viejos no traen `woorank` | TS opcional + componente renderiza fallback "Análisis no disponible". |

## Métricas de éxito

- p95 del endpoint `/api/audit` sube ≤ 3s respecto a baseline pre-feature.
- 16 chequeos cubiertos por tests Go con fixtures.
- `woorank.score` reproducible: mismo HTML → mismo score determinista.
- Sección WooRank en dashboard renderiza en < 100ms client-side.

## Referencias

- WooRank checklist público: https://www.woorank.com/en/edu/seo-guides
- Schema.org JSON-LD: https://json-ld.org/
