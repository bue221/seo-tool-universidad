# Delta audit-contract: woorank-checker

**Target spec:** `openspec/specs/audit-contract/spec.md`
**Bump:** v0.1.0 → v0.2.0
**Operación:** ADD (aditivo, retro-compatible)

---

## ADDED — Bloque `woorank` en response

### Shape

```jsonc
{
  // … campos v0.1.0 sin cambios …
  "woorank": {
    "score": 0.78,
    "checks": [
      {
        "id": "title",
        "label": "Title tag length",
        "category": "meta",
        "status": "pass",
        "weight": 2.0
      }
    ]
  }
}
```

`woorank` es **opcional** en la respuesta — clientes deben tolerar su ausencia (snapshots históricos generados pre-v0.2.0).

### `woorank.score`

- Tipo `number`, rango `[0, 1]`.
- Fórmula: `Σ (weight × outcomeValue) / Σ weight`.
  - `outcomeValue`: `pass = 1.0`, `warn = 0.5`, `fail = 0.0`.

### `woorank.checks[]`

Lista exhaustiva de 16 chequeos con shape:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | identificador estable (ver tabla) |
| `label` | string | EN, descripción humana |
| `category` | enum | `meta` / `headings` / `mobile` / `indexing` / `security` / `social` / `schema` / `a11y` |
| `status` | enum | `pass` / `warn` / `fail` |
| `evidence` | string | opcional, contexto del resultado (e.g. `"length: 25"`) |
| `weight` | number | peso fijo del check |

### Chequeos obligatorios (16)

| `id` | `category` | `weight` |
|---|---|---|
| `title` | meta | 2.0 |
| `metaDescription` | meta | 2.0 |
| `h1Single` | headings | 2.0 |
| `headingHierarchy` | headings | 1.0 |
| `viewport` | mobile | 1.5 |
| `charset` | meta | 1.0 |
| `https` | security | 2.0 |
| `langAttr` | meta | 1.0 |
| `canonical` | indexing | 1.5 |
| `robotsTxt` | indexing | 1.5 |
| `sitemapXml` | indexing | 1.5 |
| `favicon` | meta | 0.5 |
| `openGraph` | social | 1.0 |
| `twitterCard` | social | 0.5 |
| `structuredData` | schema | 1.5 |
| `imageAltCoverage` | a11y | 1.5 |

`Σ weight = 22.0`.

### Reglas de evaluación

Ver `design.md` del change para reglas pass/warn/fail por check. La spec consolidada se actualiza al archivar.

### SLA actualizado

- Sub-requests adicionales (robots.txt, sitemap.xml, favicon): timeout 5s c/u, ejecutados en paralelo con el render Playwright.
- p95 esperado del endpoint sube ≤ 3s respecto a v0.1.0.

---

## Compatibilidad

- Aditivo: clientes que no leen `woorank` siguen funcionando.
- `dashboard-web` renderiza el bloque solo si está presente.
- Snapshots `seo_snapshots` históricos sin `woorank` siguen siendo válidos.
