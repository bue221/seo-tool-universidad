# Design: competitor-compare

## Estructura

```
src/app/[locale]/(protected)/compare/
├─ page.tsx                       → form + render results
├─ _actions/run-comparison.ts     → server action
├─ _components/
│   ├─ ComparisonForm.tsx         → 1 input "yours" + 3 inputs "competitor"
│   ├─ ComparisonTable.tsx        → tabla con heatmap
│   ├─ ComparisonRadar.tsx        → Recharts RadarChart
│   ├─ KeywordGap.tsx             → diff de keywords
│   └─ ComparisonTabs.tsx         → wrapper Tabs shadcn
└─ _lib/
    ├─ compare.ts                 → normalize + heatmap helpers
    └─ types.ts
```

## Tipos

```ts
export interface ComparisonResult {
  ranAt: string;
  entries: ComparisonEntry[];
}

export interface ComparisonEntry {
  url: string;
  status: "ok" | "error";
  error?: string;
  isYou: boolean;     // true para la primera URL (la del usuario)
  audit?: AuditSnapshot;
}
```

`AuditSnapshot` ya existe en `src/lib/audit/types.ts` desde `audit-runner`.

## Server action

```ts
"use server";

import { z } from "zod";

const SCHEMA = z.object({
  yours: z.string().url(),
  competitors: z.array(z.string().url()).min(1).max(3),
});

export async function runComparison(input: unknown): Promise<ComparisonResult> {
  const { yours, competitors } = SCHEMA.parse(input);
  const urls = [yours, ...competitors];

  // dedup
  const unique = Array.from(new Set(urls.map(u => normalizeUrl(u))));
  if (unique.length < 2) throw new Error("DUPLICATE_URLS");

  const results = await Promise.allSettled(
    unique.map(u => withTimeout(runFullAudit(u), 30_000))
  );

  return {
    ranAt: new Date().toISOString(),
    entries: results.map((r, i) => toEntry(unique[i], i === 0, r)),
  };
}
```

`runFullAudit(url)` ya existe (de `audit-runner`) y devuelve `AuditSnapshot` consolidando PSI + scraper.

## Heatmap

Para cada métrica numérica con dirección conocida (más alto mejor / más bajo mejor):

```ts
function colorFor(value: number, allValues: number[], direction: "asc" | "desc"): "best" | "worst" | "mid" {
  const sorted = [...allValues].sort((a, b) => direction === "asc" ? b - a : a - b);
  if (value === sorted[0]) return "best";
  if (value === sorted[sorted.length - 1]) return "worst";
  return "mid";
}
```

Tailwind tokens:
- `best` → `bg-emerald-500/10 text-emerald-700 dark:text-emerald-300`.
- `mid`  → `bg-amber-500/10 text-amber-700 dark:text-amber-300`.
- `worst` → `bg-rose-500/10 text-rose-700 dark:text-rose-300`.

Si todas las URLs tienen el mismo valor → todas se pintan neutras (`bg-muted`).

## Direcciones por métrica

| Métrica | Direction (más bueno) |
|---|---|
| `psi.performance` | asc |
| `psi.accessibility` | asc |
| `psi.bestPractices` | asc |
| `psi.seo` | asc |
| `onPage.title.lengthScore` | asc |
| `onPage.metaDescription.lengthScore` | asc |
| `onPage.images.altCoverage` | asc |
| `woorank.score` | asc |
| `sentiment.score` | asc |

Tracking flags (`gtm.detected`, etc.) son booleanos: pintar ✓ verde / ✗ rojo, sin heatmap relativo.

## Radar chart

6 ejes normalizados [0,1]:

1. PSI Performance
2. PSI SEO
3. WooRank score (fallback 0.5 si ausente)
4. Image alt coverage
5. Title length score
6. Meta description length score

Una `<Radar>` por entry. Color por entry desde paleta fija (`emerald`, `sky`, `amber`, `rose`). Tu sitio siempre `emerald`.

## KeywordGap

```ts
function computeKeywordGap(entries: ComparisonEntry[]): {
  yoursOnly: string[];
  competitorsOnly: string[];
  shared: string[];
} {
  const yours = new Set(entries[0].audit?.scraper.keywords.top.map(k => k.term) ?? []);
  const others = new Set(
    entries.slice(1).flatMap(e => e.audit?.scraper.keywords.top.map(k => k.term) ?? [])
  );
  return {
    yoursOnly: [...yours].filter(k => !others.has(k)),
    competitorsOnly: [...others].filter(k => !yours.has(k)),
    shared: [...yours].filter(k => others.has(k)),
  };
}
```

## Form wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  Compare against competitors                                  │
│  ─────────────────────────────                                │
│  Your site *                                                  │
│  [ https://yoursite.com                              ]        │
│                                                               │
│  Competitor 1 *                                               │
│  [ https://competitor1.com                           ]        │
│  Competitor 2                                                 │
│  [                                                   ]        │
│  Competitor 3                                                 │
│  [                                                   ]        │
│                                                               │
│  [ Compare ]                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Resultados wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ Comparison ran at 2026-05-19 14:32                            │
│ Tabs: [ Table ] [ Radar ] [ Keyword gap ]                     │
│                                                               │
│ Metric              │ yoursite ★ │ comp1     │ comp2          │
│ PSI Performance     │ 0.92  best │ 0.78 mid  │ 0.61 worst     │
│ PSI SEO             │ 0.85       │ 0.90 best │ 0.72 worst     │
│ WooRank score       │ 0.78       │ 0.65      │ 0.81 best      │
│ GTM detected        │ ✓          │ ✗         │ ✓              │
│ GA4 detected        │ ✓          │ ✓         │ ✗              │
│ Top keyword         │ "ecommerce"│ "saas"    │ "marketing"    │
└──────────────────────────────────────────────────────────────┘
```

## Manejo de errores

- URL inválida en form → zod error inline en el input.
- URLs duplicadas → error global "Las URLs deben ser distintas".
- Audit individual falla → la columna muestra una sola fila "Error: TIMEOUT" + estado gris, el resto del header se muestra.
- Si todas las audits fallan → fallback de página completa con botón "Reintentar".

## Concurrency control

```ts
const SEM_MAX = 4;
// pLimit-style minimal:
async function withSem<T>(tasks: (() => Promise<T>)[], max: number): Promise<T[]> { … }
```

`runFullAudit` ya hace 2 calls (PSI + scraper-api). 4 URLs en paralelo → 8 calls concurrentes. Dentro de límites del free tier de PSI y del scraper-api en Render.

## Out-of-scope arquitectónico (cerrado)

- Sin tabla Supabase para histórico de comparaciones — agregable en futuro change `competitor-history`.
- Sin pdf export — futuro change `audit-export`.
- Sin alertas / cron — fuera del scope académico.

## Decisiones cerradas

- **Reusar `runFullAudit`** en vez de hacer un endpoint custom: si la pipeline cambia, el comparador la hereda.
- **Tu sitio fijo en primera posición** en UI: simplifica heatmap y "yoursOnly" en keyword gap.
- **`Promise.allSettled`** > `Promise.all`: errores parciales no rompen la vista.
- **Sin persistencia**: keep mvp pequeño; persistencia es ortogonal y agregable después.
