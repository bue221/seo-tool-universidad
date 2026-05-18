# Tasks: analytics-dashboard

> Marcar `[x]` al completar. Bloqueado por `audit-runner` (necesita `seo_snapshots` poblado con paths jsonb).

---

## 0. Pre-requisitos

- [ ] `audit-runner` aplicado y deployado — debe haber al menos 3 snapshots por user para testear charts.
- [ ] Validar paths jsonb esperados en `audit-runner` persistence (ej. `result->>'sentiment_polarity'` accessible).

## 1. Dependencias

- [ ] Agregar a `dashboard-web/package.json`:
  - `dependencies`: `recharts@^2.13.0`.
- [ ] `pnpm install` (bloqueado por red).

## 2. Tokens CSS

- [ ] Editar `src/styles/globals.css`:
  - Agregar `--chart-1` a `--chart-5` en `:root` y `.dark`.
  - HSL values según design.md (azul, verde, naranja, púrpura, rojo).
- [ ] Editar `tailwind.config.ts`:
  - Extender `colors` con `chart: { '1': 'hsl(var(--chart-1))', ... }` (opcional pero facilita debugging).

## 3. Tipos y URL params

- [ ] `_lib/types.ts`:
  - `AnalyticsData`, `FilterState`, `SnapshotRow`, `BucketRow`, `KeywordTrendPoint`.
- [ ] `_lib/url-params.ts`:
  - `parseFilters(searchParams, allUrls): FilterState`.
  - `stringifyFilters(state): string`.

## 4. Queries server-side

- [ ] `_lib/queries.ts`:
  - `listUserUrls()` — todas las URLs distintas auditadas por el user con count + last_audit.
  - `getBucketedData({ urls, granularity, range })` — SQL con `date_trunc`. Devuelve buckets agregados.
  - `getRecentSnapshots({ urls, range, limit = 100 })` — para la tabla.
  - `getKeywordsTrend({ url, range, granularity })` — top 5 keywords por bucket.
- [ ] Todos los queries usan `createClient()` server-side. RLS asegura aislamiento por user.

## 5. Aggregation helper

- [ ] `_lib/aggregation.ts`:
  - `normalizeKeywordsTrend(snapshots): KeywordTrendPoint[]` — rolls up density promedio por (bucket, término).
  - `computeDeltas(a, b): Delta` — para el comparison sheet.

## 6. Empty state

- [ ] `_components/EmptyState.tsx`:
  - Props: `reason: 'no_snapshots' | 'not_enough' | 'no_match'`, `count?: number`.
  - Card grande con icon + copy + CTA.

## 7. FilterBar

- [ ] `_components/FilterBar.tsx`:
  - Client Component con `useTransition`.
  - URL multi-select usando `DropdownMenu` + `DropdownMenuCheckboxItem` (o Combobox custom).
  - Date range presets como `ToggleGroup` (single).
  - Granularity como `<select>` o ToggleGroup.
  - On change → `router.replace` con nuevo querystring.

## 8. ThemedChart wrapper

- [ ] `_components/ThemedChart.tsx` — `ResponsiveContainer` + `minHeight: 280px`.
- [ ] `_components/chart-colors.ts` — exports `CHART_COLORS = ['hsl(var(--chart-1))', ...]` para reutilizar.

## 9. Los 5 charts

- [ ] `_components/ScoreEvolutionChart.tsx` — Recharts LineChart con 1 línea por URL.
- [ ] `_components/SubScoresChart.tsx` — Recharts ComposedChart con 4 líneas (performance/on-page/tracking/sentiment) para URL seleccionada (single).
- [ ] `_components/TrackingChart.tsx` — Recharts BarChart stacked con 3 bars (GTM/GA4/Ads) por bucket.
- [ ] `_components/KeywordsTrendChart.tsx` — Recharts AreaChart stacked con top 5 keywords como series.
- [ ] `_components/SentimentTrendChart.tsx` — Recharts LineChart con sentiment polarity score line.
- [ ] Cada chart wrapped en `<Card>` con `<CardHeader><CardTitle>{t('ChartName')}</CardTitle>`.

## 10. SnapshotsTable

- [ ] `_components/SnapshotsTable.tsx`:
  - HTML `<table>` semántica + Tailwind styling.
  - Columnas: checkbox, fecha (formateada con `Intl.DateTimeFormat`), url, global_score (Badge color), sentiment polarity (Badge), botón "Ver" → `next-intl/Link`.
  - State para selección (max 2).
  - Floating button "Comparar (N/2)" cuando ≥ 1 seleccionado.

## 11. ComparisonSheet

- [ ] `_components/ComparisonSheet.tsx`:
  - `Sheet` de `@/components/ui/sheet`. `side="right"` desktop, `side="bottom"` mobile (via `@media` Tailwind).
  - Dos columnas con datos del par seleccionado.
  - Deltas: ↑/↓ + número + color verde/rojo según signo.
  - Cierra con X o ESC.

## 12. Página y orquestación

- [ ] `analytics/page.tsx`:
  - Server Component.
  - `getCurrentUser()` (gateado por layout).
  - `listUserUrls()` → si vacío, render `<EmptyState reason="no_snapshots" />`.
  - Parse filters de `searchParams`.
  - Si user tiene < 3 snapshots, render `<EmptyState reason="not_enough" count={N} />`.
  - Carga `getBucketedData`, `getRecentSnapshots`, `getKeywordsTrend` en paralelo.
  - Si todos vacíos para filtros actuales, render `<EmptyState reason="no_match" />`.
  - Render `<AnalyticsClient data={...} initialFilters={...} />`.
- [ ] `_components/AnalyticsClient.tsx`:
  - Lazy load con `dynamic(() => import(...), { loading: <Skeleton /> })`.
  - Recibe data + filters.
  - Renderiza grid 2-col de charts en desktop, columna en mobile.
  - Tabla debajo.
  - Comparison sheet montado siempre, abierto si hay 2 seleccionados.

## 13. i18n

- [ ] `messages/{es,en}.json` namespaces:
  - `Analytics.Filters` (urls, dateRange.{7d,30d,90d,6m,1y}, granularity.{day,week,month}).
  - `Analytics.Charts.{ScoreEvolution,SubScores,Tracking,Keywords,Sentiment}` (title, description, axis labels).
  - `Analytics.Table` (columns: date, url, score, sentiment, view).
  - `Analytics.Comparison` (button "Comparar", drawer title, deltas legend).
  - `Analytics.Empty.{notEnoughData,noSnapshots,noMatch,resetFilters,runAuditCTA}`.

## 14. Tests

- [ ] `_lib/aggregation.test.ts`:
  - `normalizeKeywordsTrend` con casos: snapshots vacíos, 1 keyword, 5 keywords, gaps en buckets.
  - `computeDeltas` con casos: score subió, bajó, igual, snapshots vacíos.
- [ ] `_lib/url-params.test.ts`:
  - `parseFilters` con defaults, con todos presentes, con inválidos.
- [ ] Smoke e2e manual:
  - User con 5 snapshots → todos los 5 charts populados.
  - Cambiar URL filter → re-render correcto.
  - Cambiar date range → ventana correcta.
  - Seleccionar 2 rows + click "Comparar" → Sheet correcto con deltas.
  - Dark mode → charts visualmente correctos.
  - Responsive mobile → charts stacked.

## 15. Documentación

- [ ] `dashboard-web/README.md`:
  - Stack: agregar recharts.
  - Cookbook nueva receta: "agregar un chart que respete tokens HSL light/dark".
- [ ] `dashboard-web/agents.md`:
  - Capacidad nueva "Analytics Dashboard".
  - Roadmap: marcar `analytics-dashboard` activo.
- [ ] `dashboard-web/SMOKE.md`:
  - Sección smoke analytics (filtros, charts, comparison, empty states).

## 16. Cierre

- [ ] PR título: `feat(web): analytics dashboard con tendencias [analytics-dashboard]`.
- [ ] Validar specs: review manual del delta.
- [ ] Archive offline:
  - Promover delta a `openspec/specs/dashboard-web/spec.md` (v0.6.0).
  - Mover a `openspec/changes/archive/analytics-dashboard/`.
- [ ] Actualizar `openspec/README.md` y `AGENTS.md` raíz.
