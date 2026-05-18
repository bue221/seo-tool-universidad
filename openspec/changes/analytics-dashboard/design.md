# Design: analytics-dashboard

**Scope:** Cómo construimos un dashboard de tendencias sobre `seo_snapshots`, qué charts elegimos, cómo agregamos data server-side, y cómo manejamos theming.

---

## 1. Decisiones de libs

### Library para charts

| Lib | Bundle | Maintenance | API ergonomics | Tradeoff |
|-----|--------|-------------|----------------|----------|
| **Recharts ^2.13** ✅ | ~120KB gz | Activa | Excelente (React-idiomatic, declarativo) | La elegimos: balance. |
| Chart.js + react-chartjs-2 | ~80KB | Activa | OK (imperativo con plugin pattern) | Bundle menor pero API imperativa fuera de tono con React. |
| Visx (Airbnb) | depende (modular ~30-150KB) | Mantenida pero menos activa | Bajo nivel (Tu construyes el chart desde primitives) | Demasiado bajo nivel para mvp. |
| Tremor | ~150KB | Activa | Muy alta (componentes pre-armados) | API "blocks" prescriptiva; pierde flexibilidad. |
| Nivo | ~200KB+ | Activa | Buena pero deps grandes | Sobrekill para 5 charts. |

**Elegimos Recharts** por: API declarativa React-idiomatic, bundle aceptable, mantenida, theming via CSS/JSX (no JSON config), ResponsiveContainer y aria-labels out-of-the-box.

### Otras decisiones

| Capa | Elección | Por qué |
|------|----------|---------|
| Lazy load del client chart | **`next/dynamic`** | Server Component carga data; client carga recharts solo cuando se monta. |
| Filtros como state | **URL search params** | Bookmark-able + back/forward del browser funciona. |
| Aggregation | **PostgreSQL `date_trunc`** | Cómputo server-side, no JS-side. |
| Empty state visual | **Card + lucide icon `LineChart`** | Consistencia con Shadcn. |

## 2. Estructura de carpetas

```
dashboard-web/
└── src/
    ├── app/
    │   └── [locale]/
    │       └── (protected)/
    │           └── analytics/
    │               ├── page.tsx                      # Server: carga inicial, render layout
    │               ├── _components/
    │               │   ├── AnalyticsClient.tsx       # Client: orquesta charts + filtros
    │               │   ├── FilterBar.tsx             # urls multi + date range + granularity
    │               │   ├── ThemedChart.tsx           # Wrapper que aporta colors HSL
    │               │   ├── ScoreEvolutionChart.tsx
    │               │   ├── SubScoresChart.tsx
    │               │   ├── TrackingChart.tsx
    │               │   ├── KeywordsTrendChart.tsx
    │               │   ├── SentimentTrendChart.tsx
    │               │   ├── SnapshotsTable.tsx
    │               │   ├── ComparisonSheet.tsx
    │               │   ├── EmptyState.tsx
    │               │   └── chart-colors.ts           # Reads CSS tokens
    │               └── _lib/
    │                   ├── queries.ts                # Server-side fetchers
    │                   ├── aggregation.ts            # Date bucketing, normalization
    │                   ├── types.ts                  # AnalyticsData, FilterState
    │                   └── url-params.ts             # parse/stringify filter from searchParams
    └── styles/
        └── globals.css                                # MODIFIED: agregar --chart-1..5
```

## 3. Tokens CSS adicionales

```css
/* src/styles/globals.css */
@layer base {
  :root {
    /* existentes... */
    --chart-1: 220 90% 56%;   /* azul */
    --chart-2: 160 75% 45%;   /* verde */
    --chart-3: 30 95% 60%;    /* naranja */
    --chart-4: 280 70% 60%;   /* púrpura */
    --chart-5: 0 75% 60%;     /* rojo */
  }
  .dark {
    --chart-1: 220 85% 65%;
    --chart-2: 160 65% 55%;
    --chart-3: 30 90% 65%;
    --chart-4: 280 65% 70%;
    --chart-5: 0 70% 70%;
  }
}
```

Paleta diseñada para diferenciarse por **hue + lightness** (no solo hue), accesible para color blindness.

## 4. Wireframe ASCII

```
┌────────────────────────────────────────────────────────────────────┐
│ header                                                             │
├────────────────────────────────────────────────────────────────────┤
│ <FilterBar>                                                        │
│   URLs:        [example.com ▼] [otherSite.com ▼] [+ Agregar]      │
│   Periodo:     ( 7d ) ( 30d* ) ( 90d ) ( 6m ) ( 1y )              │
│   Granularidad: [Día ▼]                                            │
│ </FilterBar>                                                       │
├────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────┐  ┌────────────────────────────┐    │
│ │ Score evolution            │  │ Sub-scores breakdown        │    │
│ │ ╭───╮ ╱───╮  ╱──            │  │ —— performance              │    │
│ │  ─╯  ───╯ ──╯                │  │ —— on-page                  │    │
│ │                              │  │ —— tracking                 │    │
│ │  100 ┤ ●●●●●                 │  │ —— sentiment                │    │
│ │   50 ┤                       │  │  100                        │    │
│ │    0 ┤                       │  │   50                        │    │
│ │     └──────────────          │  │    0                        │    │
│ └────────────────────────────┘  └────────────────────────────┘    │
│ ┌────────────────────────────┐  ┌────────────────────────────┐    │
│ │ Tracking over time          │  │ Top keywords trend          │    │
│ │ [stacked bars GTM/GA4/Ads]  │  │ [stacked areas]             │    │
│ └────────────────────────────┘  └────────────────────────────┘    │
│ ┌────────────────────────────┐                                     │
│ │ Sentiment trend             │                                     │
│ │ [line -1 → 1]               │                                     │
│ └────────────────────────────┘                                     │
├────────────────────────────────────────────────────────────────────┤
│ <SnapshotsTable>                                                   │
│  ☐ │ Fecha          │ URL              │ Score │ Sentiment │ Ver  │
│  ☐ │ 2026-05-18 14h │ example.com      │ 78    │ positive  │ →    │
│  ☐ │ 2026-05-15 10h │ example.com      │ 72    │ neutral   │ →    │
│  ...                                                                │
│                                          ┌────────────────────┐    │
│                              [floating]: │  Comparar 2 (1/2)   │    │
│                                          └────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘

(Al seleccionar 2 y click Comparar, abre Sheet lateral:)

┌─────────────────────────────────────────┐
│   Sheet                              [X]│
│  Comparación                            │
│  ┌─────────────────┬─────────────────┐  │
│  │ 18/05 14h       │ 15/05 10h       │  │
│  ├─────────────────┼─────────────────┤  │
│  │ Global: 78  ↑6  │ Global: 72      │  │
│  │ Perf:   85  ↑3  │ Perf:   82      │  │
│  │ ...             │ ...             │  │
│  │ Top KW:         │ Top KW:         │  │
│  │ servicio (8.2%) │ servicio (7.9%) │  │
│  └─────────────────┴─────────────────┘  │
└─────────────────────────────────────────┘
```

## 5. SQL queries

### Aggregation (lo más caliente)

```sql
-- Snapshots in range, agrupados por granularidad
WITH bucketed AS (
  SELECT
    date_trunc($granularity, fetched_at) AS bucket,  -- 'day' | 'week' | 'month'
    url,
    AVG(global_score) AS avg_score,
    AVG((result->'pagespeed'->>'performance')::numeric) AS avg_perf,
    AVG((result->>'sentiment_score')::numeric) AS avg_sentiment,
    COUNT(*) AS snapshot_count
  FROM seo_snapshots
  WHERE user_id = auth.uid()
    AND url = ANY($urls::text[])
    AND fetched_at >= $start
    AND fetched_at < $end
  GROUP BY bucket, url
)
SELECT * FROM bucketed ORDER BY bucket ASC;
```

### Distinct URLs del user (para filter bar)

```sql
SELECT url, MAX(fetched_at) AS last_audit, COUNT(*) AS n_audits
FROM seo_snapshots
WHERE user_id = auth.uid()
GROUP BY url
ORDER BY last_audit DESC;
```

### Latest 100 snapshots (table)

```sql
SELECT
  id, url, global_score, fetched_at,
  result->>'sentiment_polarity' AS sentiment_polarity
FROM seo_snapshots
WHERE user_id = auth.uid()
  AND url = ANY($urls::text[])
  AND fetched_at >= $start
ORDER BY fetched_at DESC
LIMIT 100;
```

**Importante:** los campos `result->'pagespeed'->>'performance'` y `result->>'sentiment_polarity'` asumen que `audit-runner` guarda con esos paths. Si la persistencia de `audit-runner` cambia, esto se actualiza en un MODIFIED change.

### Keywords (último N por URL)

```sql
SELECT id, fetched_at, result->'keywords'->'top' AS keywords
FROM seo_snapshots
WHERE user_id = auth.uid()
  AND url = $url
ORDER BY fetched_at DESC
LIMIT 30;
```

Cliente luego rolls up: para cada `bucket`, calcula promedio de `density` por término en los snapshots dentro del bucket.

## 6. Filter state via URL params

```
/analytics?urls=example.com,foo.com&range=30d&gran=day
```

```ts
// _lib/url-params.ts
export type FilterState = {
  urls: string[];
  range: '7d' | '30d' | '90d' | '6m' | '1y';
  granularity: 'day' | 'week' | 'month';
};

export function parseFilters(searchParams: URLSearchParams, allUrls: string[]): FilterState {
  return {
    urls: searchParams.get('urls')?.split(',').filter(Boolean) ?? allUrls.slice(0, 1),
    range: (searchParams.get('range') as FilterState['range']) ?? '30d',
    granularity: (searchParams.get('gran') as FilterState['granularity']) ?? 'day',
  };
}
```

Client component usa `useTransition` + `router.replace('/analytics?urls=...&range=...')` para evitar bloqueo de UI.

## 7. ThemedChart wrapper

```tsx
'use client';
import { useTheme } from 'next-themes';
import { ResponsiveContainer } from 'recharts';

export function ThemedChart({ children, minHeight = 280 }: Props) {
  const { resolvedTheme } = useTheme();
  // resolvedTheme es 'light' | 'dark' tras mount; no necesitamos pasar colors
  // explícitos porque cada chart lee CSS vars con stroke="hsl(var(--chart-1))" inline.
  return (
    <ResponsiveContainer width="100%" minHeight={minHeight}>
      {children}
    </ResponsiveContainer>
  );
}
```

Los charts dentro usan `stroke="hsl(var(--chart-1))"` etc. Tailwind no procesa esos strings, pero Recharts los pasa directo a SVG attributes que sí entienden la sintaxis `hsl(var(--...))` moderna (Chrome 121+ con CSS Color 4).

**Fallback** para browsers viejos: usar `hsl(220 90% 56%)` literal. Si surge problema, agregar derivación TS-side leyendo `getComputedStyle(document.documentElement).getPropertyValue('--chart-1')`.

## 8. Comparison Sheet

- Activador: 2 checkbox rows seleccionados en table.
- `Sheet` de `@/components/ui/sheet` con `side="right"` en desktop, `side="bottom"` en mobile.
- Side-by-side de 2 columnas (en mobile: stacked).
- Diffs visualizados: score con flecha ↑/↓ + delta (color rojo/verde según signo).

## 9. Empty states

| Caso | UI |
|------|----|
| 0 snapshots | Card grande + icon LineChart + texto + Button "Realizar primera auditoría" → `/audit`. |
| < 3 snapshots | Card + texto "Necesitas al menos 3 auditorías para ver tendencias. Tienes: N" + Button → `/audit`. |
| Filtros sin matches | Card pequeña + texto "Sin datos para los filtros seleccionados" + Button "Resetear filtros". |

## 10. Tradeoffs aceptados

- **Recharts (~120KB)** vs Chart.js (~80KB): elegimos UX devex. Bundle penalizable pero el chart bundle es lazy-loaded.
- **Date range presets vs picker libre**: presets son 90% de los casos. Picker custom agregaría dep (`react-day-picker` ~30KB). mvp lo deja para futuro.
- **No paginar table**: limit 100 snapshots por rango. Si user tiene > 100 en 1y, mostramos los más recientes.
- **`result->>'paths'` requiere coupling con persistence de `audit-runner`**: si cambia, MODIFIED change explícito en analytics-dashboard.
- **Charts theming via CSS vars + `hsl(var(--))` sintaxis**: requiere browser moderno. Si vemos breakage en algún browser corporativo, fallback a derivación TS.
- **Comparison limitada a 2 snapshots**: 3-way agregaría complejidad UI (cómo mostrar deltas) sin valor demostrable.

## 11. Plan de rollout

1. Aplicar tokens CSS chart-1..5.
2. Implementar queries server.
3. PR mergeable solo si `audit-runner` ya guarda con los paths jsonb esperados (`result->>'sentiment_polarity'`, etc.).
4. Smoke: user con 5+ snapshots de 1+ URLs → todos los charts populados.
5. Smoke comparison: seleccionar 2 rows → sheet correcto.
6. Smoke responsive: chrome devtools mobile viewport → charts apilados.
