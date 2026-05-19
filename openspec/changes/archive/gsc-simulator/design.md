# Design: gsc-simulator

## Arquitectura

```
┌────────────────────────────────────────────────────────────────┐
│ /[locale]/(protected)/gsc/                                     │
│ ├─ page.tsx                  → landing (lista propiedades)     │
│ ├─ [property]/overview/      → KPIs + time series              │
│ ├─ [property]/queries/       → tabla top 50 queries            │
│ ├─ [property]/pages/         → tabla top 50 pages              │
│ ├─ [property]/devices/       → donut + tabla                   │
│ ├─ [property]/countries/     → tabla top 20 países             │
│ ├─ _components/              → MetricCards, TimeSeriesChart…   │
│ └─ _lib/properties.ts        → query propiedades del usuario   │
│                                                                 │
│ src/lib/gsc/                                                   │
│ ├─ generator.ts              → API pública                     │
│ ├─ prng.ts                   → mulberry32 + sha256             │
│ ├─ stopwords.ts              → para query generation           │
│ ├─ tld-map.ts                → mapping TLD → distribución país │
│ └─ types.ts                                                    │
└────────────────────────────────────────────────────────────────┘
```

## Modelo de datos sintético

### `GscDataset`

```ts
export type GscRange = 7 | 28 | 90;

export interface GscDataset {
  property: string;          // dominio normalizado
  range: GscRange;
  totals: GscMetrics;
  previousPeriodTotals: GscMetrics;  // para deltas
  series: GscSeriesPoint[];          // length === range
  queries: GscDimensionRow[];        // top 50
  pages: GscDimensionRow[];          // top 50
  devices: GscDeviceRow[];           // 3 items
  countries: GscCountryRow[];        // top 20
}

export interface GscMetrics {
  clicks: number;
  impressions: number;
  ctr: number;       // [0, 1]
  position: number;  // [1, 100]
}

export interface GscSeriesPoint extends GscMetrics {
  date: string;      // YYYY-MM-DD
}

export interface GscDimensionRow extends GscMetrics {
  key: string;       // query string o page path
}

export interface GscDeviceRow extends GscMetrics {
  device: "mobile" | "desktop" | "tablet";
}

export interface GscCountryRow extends GscMetrics {
  countryCode: string;  // ISO 3166-1 alpha-2
  countryName: string;  // localized via i18n? no — siempre en EN
}
```

## Generador

### PRNG

```ts
// src/lib/gsc/prng.ts
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export async function seedFromDomain(domain: string): Promise<number> {
  const data = new TextEncoder().encode(domain.toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  const view = new DataView(hash);
  return view.getUint32(0, false);
}
```

`crypto.subtle` está disponible en Node 20+ (runtime de Next 14 server components). Para tests Jest usar `globalThis.crypto = require("crypto").webcrypto`.

### Heurísticos

| Métrica | Fórmula |
|---|---|
| `dailyImpressions` | base = 500 + (domain.length × 200) + rand(0, 4000). Multiplicador weekday/weekend (×1.15 / ×0.7). |
| `dailyClicks` | `impressions × ctrFor(day)` con `ctrFor` PRNG en [0.015, 0.12]. |
| `dailyPosition` | `8 + rand(−3, 12)` → clamp [1, 100]. |
| `queries` | 50 queries generadas por composición: marca (10) + long-tail (40). Vocabulario fijo + dominio interpolado. |
| `pages` | 50 paths sintéticos: `/`, `/about`, `/contact`, `/blog/${slug}`, `/services/${slug}`… |
| `devices` | mobile 0.60 ±0.05, desktop 0.35 ±0.05, tablet resto. |
| `countries` | TLD map: `.es`→ES dominante, `.co`→CO dominante, `.com`/otros → US dominante + LATAM + EU. |

### Vocabulario de queries

`src/lib/gsc/vocab.ts` con arrays:

```ts
export const BRAND_PATTERNS = [
  "{domain}",
  "{domain} login",
  "{domain} precios",
  "{domain} pricing",
  "{domain} review",
  // …10 patterns
];

export const LONGTAIL_PATTERNS = [
  "mejor {topic} para {audience}",
  "best {topic} for {audience}",
  "cómo usar {topic}",
  "{topic} vs alternativas",
  // …~20 patterns
];

export const TOPICS = ["seo", "marketing", "analytics", "ecommerce", "saas", "agencia", "freelance", "wordpress"];
export const AUDIENCES = ["pymes", "startups", "agencias", "ecommerce", "blogs"];
```

40 long-tail × seleccionar 40 sin duplicados (fisher-yates con PRNG).

## API pública

```ts
// src/lib/gsc/generator.ts
export async function getGscDataset(domain: string, range: GscRange): Promise<GscDataset>;
```

Server-only (no `"use client"`). Llamado desde server components y server actions.

## Resolución de propiedades

```ts
// src/app/[locale]/(protected)/gsc/_lib/properties.ts
export async function listUserProperties(userId: string): Promise<string[]> {
  // SELECT DISTINCT url FROM seo_snapshots WHERE user_id = $1 ORDER BY MAX(created_at) DESC LIMIT 50
}

export async function assertUserOwnsProperty(userId: string, property: string): Promise<void> {
  // si no existe → notFound() de next/navigation
}
```

`property` se compara después de normalizar (lowercase, sin trailing slash).

## Wireframe textual

### `/gsc` (landing)

```
┌──────────────────────────────────────────────────────────────┐
│  Search Console                                               │
│  ────────────                                                 │
│  Tus propiedades verificadas (simuladas a partir de tus      │
│  auditorías recientes).                                       │
│                                                               │
│  [card] example.com         28d                               │
│  ▸ 12,453 clicks  ▸ 245,678 imp  ▸ 5.07% CTR  ▸ pos 7.2       │
│                                                               │
│  [card] otro.com            28d                               │
│  ▸ 980 clicks  ▸ 42,108 imp  ▸ 2.33% CTR  ▸ pos 14.8          │
│                                                               │
│  Si no ves propiedades: corré una auditoría primero. [→ /audit]│
└──────────────────────────────────────────────────────────────┘
```

### `/gsc/[property]/overview`

```
┌──────────────────────────────────────────────────────────────┐
│ ◀ propiedades  /  example.com  ›  Overview                   │
│ Range: [ 7d ] [▣ 28d ] [ 3m ]                                │
│                                                               │
│ ┌──────────┬──────────┬──────────┬──────────┐                │
│ │ Clicks   │ Impr.    │ CTR      │ Position │                │
│ │ 12,453   │ 245,678  │ 5.07%    │ 7.2      │                │
│ │ ▲ +8.4%  │ ▲ +3.1%  │ ▲ +1.2pp │ ▼ −0.6   │                │
│ └──────────┴──────────┴──────────┴──────────┘                │
│                                                               │
│ [time series line chart: clicks + impressions]                │
│ [sparkline CTR]   [sparkline position]                        │
│                                                               │
│ Tabs: Overview · Queries · Pages · Devices · Countries        │
└──────────────────────────────────────────────────────────────┘
```

## Testing

- `prng.test.ts` — determinismo: misma seed → mismos primeros 100 valores.
- `generator.test.ts`:
  - mismo dominio + mismo range → dataset deep-equal.
  - `range=7` → `series.length === 7`.
  - `queries.length === 50`, `pages.length === 50`, `devices.length === 3`, `countries.length === 20`.
  - todos los CTR ∈ [0, 1], position ∈ [1, 100].
  - top query por clicks tiene CTR > top query por position? — no asumir, validar solo invariantes.
- Snapshot test: `getGscDataset("example.com", 28)` → JSON snapshot estable.

## Path de integración real (documentado, no implementado)

Si en el futuro alguien quiere conectar GSC real:

1. Agregar Supabase tabla `gsc_oauth_tokens (user_id, access_token, refresh_token, expires_at)`.
2. Implementar OAuth code flow contra `https://accounts.google.com/o/oauth2/v2/auth` con scope `https://www.googleapis.com/auth/webmasters.readonly`.
3. Reemplazar `getGscDataset` por adapter que llame a `searchanalytics.query` y mantenga el mismo shape `GscDataset`.
4. UI no cambia.

Este flujo está fuera de scope académico pero la arquitectura ya está preparada (single function boundary).

## Decisiones cerradas

- **Sin tablas nuevas** — propiedades derivadas de `seo_snapshots`. Reduce mantenimiento y refuerza UX "auditá primero".
- **Server-side rendering** de todas las páginas — datasets son rápidos y deterministas, no necesitamos cache de cliente.
- **No localizar nombres de país** — usamos siempre EN (`United States`) para consistencia con shape de la API real.
- **Selector de rango** vive en URL search param (`?range=28`) para shareability.
