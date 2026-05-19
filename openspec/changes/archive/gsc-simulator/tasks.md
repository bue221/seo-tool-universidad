# Tasks: gsc-simulator

**Forecast LOC:** ~850 (chained PR recomendado — pasa el budget de 400).

## Plan de PRs (chained)

| PR | Slug | Forecast | Contenido |
|----|------|----------|-----------|
| 1  | `gsc-simulator-engine` | ~300 | `src/lib/gsc/*` + tests + i18n keys base |
| 2  | `gsc-simulator-ui-overview` | ~280 | Routing, landing, overview, MetricCards, TimeSeriesChart, RangeSelector |
| 3  | `gsc-simulator-ui-dimensions` | ~270 | Queries, Pages, Devices, Countries + DimensionTable + DevicesDonut |

---

## PR 1 — Engine + tests

- [ ] `src/lib/gsc/types.ts` — todas las interfaces (`GscDataset`, `GscMetrics`, `GscSeriesPoint`, `GscDimensionRow`, `GscDeviceRow`, `GscCountryRow`, `GscRange`).
- [ ] `src/lib/gsc/prng.ts` — `mulberry32` + `seedFromDomain` (SHA-256 via `crypto.subtle`).
- [ ] `src/lib/gsc/prng.test.ts` — determinismo, rango uniforme [0, 1), seeds distintos producen secuencias distintas.
- [ ] `src/lib/gsc/vocab.ts` — `BRAND_PATTERNS`, `LONGTAIL_PATTERNS`, `TOPICS`, `AUDIENCES`.
- [ ] `src/lib/gsc/tld-map.ts` — mapping `.es`/`.co`/`.mx`/`.ar`/`.com`/default → distribución país.
- [ ] `src/lib/gsc/generator.ts`:
  - [ ] `getGscDataset(domain, range)` orquestador.
  - [ ] `generateSeries`, `generateQueries`, `generatePages`, `generateDevices`, `generateCountries` privadas.
  - [ ] `normalizeDomain(input)` — lowercase, strip protocol, strip trailing slash.
- [ ] `src/lib/gsc/generator.test.ts`:
  - [ ] determinismo (deep-equal en 2 llamadas).
  - [ ] cardinalidades (50/50/3/20).
  - [ ] invariantes (CTR ∈ [0,1], position ∈ [1,100], clicks ≤ impressions).
  - [ ] `previousPeriodTotals` calculado correctamente.
  - [ ] snapshot estable de `getGscDataset("example.com", 28)`.
- [ ] Strings i18n `GSC.Common` base en `messages/en.json` y `messages/es.json`.

## PR 2 — Routing + overview

- [ ] `src/app/[locale]/(protected)/gsc/page.tsx` — landing.
- [ ] `src/app/[locale]/(protected)/gsc/_lib/properties.ts`:
  - [ ] `listUserProperties(userId)`.
  - [ ] `assertUserOwnsProperty(userId, property)`.
- [ ] `src/app/[locale]/(protected)/gsc/[property]/layout.tsx` — sub-nav tabs (Overview/Queries/Pages/Devices/Countries) + `RangeSelector`.
- [ ] `src/app/[locale]/(protected)/gsc/[property]/overview/page.tsx`.
- [ ] `src/app/[locale]/(protected)/gsc/_components/PropertyCard.tsx`.
- [ ] `src/app/[locale]/(protected)/gsc/_components/RangeSelector.tsx` — actualiza search param `?range=`.
- [ ] `src/app/[locale]/(protected)/gsc/_components/MetricCards.tsx` — 4 KPIs + delta.
- [ ] `src/app/[locale]/(protected)/gsc/_components/TimeSeriesChart.tsx` — Recharts LineChart.
- [ ] Nav item en sidebar protegido entre Analytics y GBP.
- [ ] i18n: `GSC.Landing`, `GSC.Overview`.
- [ ] Smoke test: usuario sin snapshots → landing muestra CTA hacia `/audit`.
- [ ] Smoke test: `/gsc/dominio-no-mio.com/overview` → 404.

## PR 3 — Dimensiones

- [ ] `src/app/[locale]/(protected)/gsc/[property]/queries/page.tsx`.
- [ ] `src/app/[locale]/(protected)/gsc/[property]/pages/page.tsx`.
- [ ] `src/app/[locale]/(protected)/gsc/[property]/devices/page.tsx`.
- [ ] `src/app/[locale]/(protected)/gsc/[property]/countries/page.tsx`.
- [ ] `_components/DimensionTable.tsx` — props genéricas (rows, columns, sortable, paginación cliente).
- [ ] `_components/DevicesDonut.tsx` — Recharts PieChart.
- [ ] `_components/CountryFlag.tsx` — emoji desde ISO alpha-2 (helper inline, sin dep).
- [ ] i18n: `GSC.Queries`, `GSC.Pages`, `GSC.Devices`, `GSC.Countries`.
- [ ] Verificación visual ambos temas + Lighthouse a11y ≥ 0.90.

## Verify

- [ ] `pnpm test` verde (incluyendo nuevos snapshot tests).
- [ ] `pnpm build` ok.
- [ ] Validar manualmente: corro auditoría de 2 dominios → veo ambos en `/gsc` → cada uno muestra dataset distinto pero estable.
- [ ] `openspec validate gsc-simulator`.

## Archive

- [ ] Mover `openspec/changes/gsc-simulator/` a `openspec/changes/archive/gsc-simulator/`.
- [ ] Bump `openspec/specs/dashboard-web/spec.md` a v0.3.0.
- [ ] Actualizar `AGENTS.md` §7 con el nuevo change archivado.
