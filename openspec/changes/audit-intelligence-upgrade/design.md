# Design: audit-intelligence-upgrade

## 1) Architecture additions

### 1.1 scraper-api

`POST /api/audit` mantiene compatibilidad y suma bloques opcionales:

```json
{
  "crawl": {
    "pagesVisited": 12,
    "maxPages": 15,
    "truncated": true,
    "maxDepth": 2
  },
  "siteStructure": {
    "root": "example.com",
    "nodes": [
      { "id": "/", "label": "/", "depth": 0, "children": ["/blog", "/pricing"] }
    ]
  },
  "observability": {
    "stages": [
      { "name": "fetch", "status": "ok", "durationMs": 832 },
      { "name": "parse", "status": "ok", "durationMs": 46 }
    ],
    "totalDurationMs": 2180
  },
  "recommendations": [
    {
      "id": "meta-description-length",
      "title": "Fix meta description length",
      "impact": "high",
      "effort": "low",
      "reason": "Current length is 42 chars"
    }
  ]
}
```

### 1.2 dashboard-web

- Audit detail tabs nuevas:
  - `Recommendations`
  - `Structure`
- Compare:
  - guardado de resultado + historial.
- GSC/GBP:
  - badges y banner “simulated data”.

## 2) Crawl strategy (tree builder)

- Seed URL = URL auditada.
- Solo enlaces internos same-host.
- Normalización URL: quitar hash/query para dedup.
- BFS por profundidad.
- `maxDepth = 2` (MVP).
- `maxPages` configurable en env de scraper, bounded `[10..15]`, default `15`.
- Si alcanza límite: `crawl.truncated = true`.

## 3) Recommendation engine

Reglas deterministas desde resultado actual:

- Title/meta out-of-range → impacto high, esfuerzo low.
- H1 count != 1 → impacto medium.
- Alt coverage < 0.8 → impacto medium.
- Tracking faltante según intención (si hay campañas detectadas incompletas) → impacto medium/high.
- WooRank checks `fail/warn` → recomendaciones mapeadas por `id`.

Ordenado por score `impactWeight - effortWeight`.

## 4) Observability model

`observability.stages[]`:

- `fetch`
- `parse`
- `tracking`
- `woorank`
- `crawl`
- `recommendations`
- `persist` (dashboard side)

Cada etapa: `{ name, status: ok|warn|error|skipped, durationMs, code? }`.

## 5) Persistence changes

Nueva tabla `seo_comparisons`:

- `id uuid pk`
- `user_id text`
- `input jsonb` (yours + competitors)
- `result jsonb`
- `fetched_at timestamptz`

RLS igual patrón de `seo_snapshots`.

## 6) UI tree rendering

Componente `SiteTree.tsx`:

- Render jerárquico por path usando `<ul>/<li>` + líneas CSS.
- Collapsible nodos con children.
- Tooltip con metadata (depth, children count).
- Fallback empty-state si `siteStructure.nodes` vacío.

## 7) Performance / safety

- Presupuesto total scraper: 30s.
- `crawl` budget dedicado: 8s.
- Si excede budget: cortar y devolver parcial (no fail total).
- Evitar parallel writers en implementación: secuencial por módulo.
