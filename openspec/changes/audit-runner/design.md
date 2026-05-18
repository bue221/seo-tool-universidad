# Design: audit-runner

**Scope:** Cómo orquestamos PageSpeed + scraper-api en paralelo, unificamos resultados, calculamos `globalScore`, persistimos y renderizamos.

---

## 1. Decisiones de libs

| Capa | Elección | Alternativas descartadas | Por qué |
|------|----------|--------------------------|---------|
| Orquestación | **Server Action `runAudit`** | Route Handler `/api/audit`, Client-side fetch | Server Actions permiten leer `getCurrentUser()` sin overhead, hacen `revalidatePath` post-insert, y mantienen secrets (PAGESPEED_API_KEY) en server. Route Handler agregaría boilerplate. |
| Fetch en paralelo | **`Promise.allSettled`** | `Promise.all` (fail-fast) | Queremos resultados parciales — fail-fast nos rompería UX cuando un upstream cae. |
| Validación de respuesta upstream | **`zod` con `.safeParse`** | `JSON.parse` + casting manual | Las respuestas de Google PageSpeed cambian campos a veces. Zod nos da seguridad. |
| Persistence | **Supabase insert directo** (RLS) | Server-side queue / job | mvp no necesita queue; insert sincrónico con RLS basta. |
| Cache | **None — `force-no-store` en queries de Server Components** | Next 15 cache automático | No queremos servir snapshot de otro user por error. Mejor caro y seguro. |

## 2. Estructura de carpetas

```
dashboard-web/
├── supabase/
│   └── migrations/
│       └── 0002_seo_snapshots.sql
└── src/
    ├── app/
    │   └── [locale]/
    │       └── (protected)/
    │           └── audit/
    │               ├── page.tsx                  # Form + History list
    │               ├── [snapshotId]/page.tsx     # Detail
    │               ├── _actions/
    │               │   └── run-audit.ts          # Server action
    │               └── _components/
    │                   ├── AuditForm.tsx
    │                   ├── AuditHistoryList.tsx
    │                   ├── ScoreBadge.tsx
    │                   ├── PageSpeedSection.tsx
    │                   ├── OnPageSection.tsx
    │                   ├── TrackingSection.tsx
    │                   ├── KeywordsSection.tsx
    │                   └── SentimentSection.tsx
    └── lib/
        ├── audit/
        │   ├── pagespeed.ts        # fetchPageSpeed(url): Result<PageSpeedScores>
        │   ├── scraper.ts          # fetchScraper(url): Result<AuditContractResponse>
        │   ├── score.ts            # calculateGlobalScore(input): number
        │   ├── persistence.ts      # saveSnapshot, getSnapshot, listSnapshots
        │   └── types.ts            # AuditResult, PartialFailure, etc.
        └── env.ts                  # serverEnv extendido
```

## 3. Esquema SQL

```sql
-- supabase/migrations/0002_seo_snapshots.sql

create table public.seo_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null check (char_length(url) <= 2000),
  result jsonb not null,
  global_score numeric(5,2) not null check (global_score between 0 and 100),
  partial_failure jsonb,  -- { pagespeed?: 'TIMEOUT'|'INVALID_RESPONSE'|...; scraper?: ... }
  fetched_at timestamptz not null default now()
);

alter table public.seo_snapshots enable row level security;

create policy "users read own snapshots"
  on public.seo_snapshots for select
  using (auth.uid() = user_id);

create policy "users insert own snapshots"
  on public.seo_snapshots for insert
  with check (auth.uid() = user_id);

-- Index para queries por user ordenadas por fecha
create index seo_snapshots_user_fetched_idx
  on public.seo_snapshots (user_id, fetched_at desc);

-- Index para queries de analytics-dashboard por url
create index seo_snapshots_user_url_fetched_idx
  on public.seo_snapshots (user_id, url, fetched_at desc);
```

## 4. Flujo del runAudit

```
        ┌─────────────────────────────┐
        │   Server Action runAudit    │
        │   (URL validada con zod)    │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   ┌────▼────────────┐     ┌──────────▼─────────┐
   │ fetchPageSpeed  │     │   fetchScraper     │
   │ (Google API)    │     │ (scraper-api Go)   │
   │ timeout 25s     │     │ timeout 30s        │
   └────┬────────────┘     └──────────┬─────────┘
        │                             │
        └─────────┬───────────────────┘
                  │ Promise.allSettled
                  ▼
        ┌────────────────────────┐
        │  Merge results         │
        │  + calc globalScore    │
        │  + track partialFail   │
        └──────────┬─────────────┘
                   │
                   ▼
        ┌────────────────────────┐
        │  INSERT seo_snapshots  │
        │  (RLS: user_id check)  │
        └──────────┬─────────────┘
                   │
                   ▼
        ┌────────────────────────┐
        │  revalidatePath        │
        │  redirect detail page  │
        └────────────────────────┘
```

Si ambos fallan → no se inserta nada, retorna `{ ok: false, error }` para que el form muestre el error.

## 5. PageSpeed integration

### Endpoint

```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  ?url=<encodeURIComponent(URL)>
  &key=<PAGESPEED_API_KEY>
  &strategy=mobile
  &category=PERFORMANCE
  &category=ACCESSIBILITY
  &category=BEST_PRACTICES
  &category=SEO
```

### Schema de respuesta (subset relevante)

```ts
const pageSpeedSchema = z.object({
  lighthouseResult: z.object({
    categories: z.object({
      performance: z.object({ score: z.number().nullable() }),
      accessibility: z.object({ score: z.number().nullable() }),
      'best-practices': z.object({ score: z.number().nullable() }),
      seo: z.object({ score: z.number().nullable() }),
    }),
    audits: z.object({
      'first-contentful-paint': z.object({ displayValue: z.string().optional() }).optional(),
      'largest-contentful-paint': z.object({ displayValue: z.string().optional() }).optional(),
      'cumulative-layout-shift': z.object({ displayValue: z.string().optional() }).optional(),
      'total-blocking-time': z.object({ displayValue: z.string().optional() }).optional(),
    }).optional(),
  }),
});
```

Convertimos a shape interna `PageSpeedScores`:

```ts
type PageSpeedScores = {
  performance: number;      // 0-100
  accessibility: number;    // 0-100
  bestPractices: number;    // 0-100
  seo: number;              // 0-100
  fcp?: string;
  lcp?: string;
  cls?: string;
  tbt?: string;
};
```

(Score viene 0-1 en la API; multiplicamos por 100.)

## 6. Fórmula de `globalScore`

```
weight = {
  pagespeedPerformance: 0.40,
  pagespeedSeo:         0.20,
  onPage:               0.20,
  tracking:             0.10,
  sentiment:            0.10,
}

pagespeedPerformance = pageSpeedScores.performance              // 0-100
pagespeedSeo         = pageSpeedScores.seo                      // 0-100
onPage = (title.lengthScore + meta.lengthScore + images.altCoverage + (h1.count === 1 ? 1 : 0)) / 4 * 100
tracking = ((gtm.detected ? 1 : 0) + (ga4.detected ? 1 : 0) + (googleAds.detected ? 1 : 0)) / 3 * 100
sentiment = ((sentiment.score + 1) / 2) * 100   // -1..1 → 0..100

globalScore = sum of (weight[k] * value[k])
```

### Manejo de partial failures en la fórmula

- Si `pagespeed` falla totalmente: renormalizar pesos sobre lo que sobrevive.
  - Nuevo total = 0.20 + 0.10 + 0.10 = 0.40
  - Renormalizar: `onPage/0.40 * 0.50`, `tracking/0.40 * 0.25`, `sentiment/0.40 * 0.25`.
- Si `scraper` falla totalmente:
  - Solo PageSpeed disponible. `globalScore = pagespeedPerformance * 0.667 + pagespeedSeo * 0.333`.

Implementación en `src/lib/audit/score.ts` con tests unit.

## 7. Manejo de fallos parciales

```ts
type AuditResult = {
  url: string;
  fetchedAt: string;
  pagespeed: PageSpeedScores | null;
  scraper: AuditContractResponse | null;
  globalScore: number;
  partialFailure?: {
    pagespeed?: 'TIMEOUT' | 'RATE_LIMIT' | 'INVALID_RESPONSE' | 'UNREACHABLE';
    scraper?: 'TIMEOUT' | 'UPSTREAM_5XX' | 'INVALID_RESPONSE' | 'UNREACHABLE';
  };
};
```

En el detail page, cada sección revisa `partialFailure[origen]` y renderiza fallback (`Card` destructive) si aplica.

## 8. Wireframe ASCII de detail page

```
┌─────────────────────────────────────────────────────────┐
│ header: LocaleSwitcher · ThemeToggle · UserMenu         │
├─────────────────────────────────────────────────────────┤
│   ← Atrás                                                │
│                                                          │
│   https://example.com                                    │
│   Auditado el 18 may 2026 14:30                          │
│                                                          │
│   ┌──────────────────────────────────────┐               │
│   │           Global Score                │               │
│   │              72                        │               │
│   │           [verde claro]               │               │
│   └──────────────────────────────────────┘               │
│                                                          │
│   [ PageSpeed ] [ On-Page ] [ Tracking ] [ Keywords ]    │
│   [ Sentiment ]                                          │
│                                                          │
│   ┌──────────────────────────────────────┐               │
│   │ (contenido del tab activo)            │               │
│   └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

## 9. Tradeoffs aceptados

- **`Promise.allSettled` vs `Promise.all`:** elegimos allSettled para UX (resultado parcial). Trade-off: si ambos fallan, no nos enteramos hasta procesar los rechazos.
- **Re-normalización de pesos en fallo parcial** es matemáticamente cuestionable (un `globalScore` calculado sobre subset puede ser engañoso) pero **muy comprensible para usuario académico**. Documentado en UI: si hay partialFailure, mostrar badge "Score parcial".
- **No usamos React Query / SWR:** el detail page es Server Component que fetchea con cache `'force-no-store'`. Para el form, server action + redirect. No necesitamos client-side state library.
- **No paginamos histórico:** mostramos 10 últimos. mvp es suficiente. Si llegamos a 50+ snapshots por user, paginar.
- **Detección de `partialFailure.scraper` mapea el campo `error` del audit-contract** — si scraper responde 200 con `{ error: 'TIMEOUT' }`, lo tratamos como partial failure.

## 10. Plan de rollout

1. Aplicar migración SQL `0002_seo_snapshots.sql`.
2. PR mergeable solo si `auth-foundation` y `scraper-foundation` están deployados (uno requiere `getCurrentUser()`, el otro `SCRAPER_API_URL` accesible).
3. Smoke: auditar 3 URLs distintas. Verificar persistencia, RLS, partial-failure handling.
4. Documentar en `SMOKE.md` el flujo completo de auditoría.
