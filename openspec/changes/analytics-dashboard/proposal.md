# Proposal: analytics-dashboard

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-18
**Depends on:**
- [`auth-foundation`](../auth-foundation/) (proposed) — user identity + RLS.
- [`audit-runner`](../audit-runner/) (proposed) — tabla `seo_snapshots` poblada con histórico.
- [`ui-foundation`](../archive/ui-foundation/) — Card, Tabs, Skeleton, Badge.

---

## ¿Por qué?

`audit-runner` deja al usuario con snapshots individuales, uno por vez. Pero para entender la **salud SEO real** de un sitio se necesitan tendencias:

- ¿El score subió o bajó las últimas semanas?
- ¿Las keywords cambian con el tiempo?
- ¿El sentiment del contenido se mantiene positivo?
- ¿Cuándo se desinstaló GTM y por qué?

Un dashboard con gráficos históricos resuelve esto y cierra el módulo "analytics" del alcance académico. Aprovecha que `seo_snapshots` ya es el source-of-truth versionado.

## ¿Qué?

### Alcance (in-scope)

1. **Página `/[locale]/(protected)/analytics`** (autenticada, dentro del `(protected)/` layout).
2. **Filter bar** arriba de la página:
   - **URL multi-select** (Combobox custom o usar `DropdownMenuCheckboxItem`): muestra solo las URLs que el user ha auditado. Default: la URL más recientemente auditada.
   - **Date range presets**: `7d`, `30d`, `90d`, `6m`, `1y`. Sin custom picker en mvp.
   - **Granularidad**: `day`, `week`, `month`. Default `day` para ≤ 30d, `week` para 30d–6m, `month` para >6m. Toggleable.
3. **5 charts** (todos Recharts envueltos en wrapper que respeta el tema):
   - **Score evolution** (LineChart): `globalScore` por fecha × URL seleccionada.
   - **Sub-scores breakdown** (ComposedChart): PageSpeed performance + on-page + tracking + sentiment como líneas separadas. Permite ver qué métrica está jalando el score global.
   - **Tracking presence over time** (BarChart stacked): para cada snapshot, bars apilados de GTM/GA4/Ads (1 = detectado, 0 = no).
   - **Top keywords trend** (AreaChart): evolución de density de las top 5 keywords detectadas, normalizadas. Stacked area opcional.
   - **Sentiment trend** (LineChart): polarity score (-1 a 1).
4. **Snapshots table** (debajo de charts):
   - Columnas: fecha, url, globalScore (badge color), sentiment polarity (badge), link al detail (`/audit/[id]`).
   - Construida con primitives (no DataTable de Shadcn). Usa `<table>` semántico + cn() para styling.
   - Sin paginación en mvp — limit 100 últimos por rango.
5. **Comparación 2-way**:
   - Usuario hace click en checkbox de 2 rows en la table → aparece floating button "Comparar".
   - Click → drawer (`Sheet`) lateral con side-by-side de las dos snapshots seleccionadas: globalScore, sub-scores, top 5 keywords, sentiment.
   - Solo hasta 2 snapshots a la vez. Si selecciona 3, deselecciona el primero.
6. **Empty state**:
   - Si user tiene < 3 snapshots: render `Card` con CTA "Necesitas al menos 3 auditorías para ver tendencias" + link a `/audit`.
   - Si tiene snapshots pero ningún filtro coincide: "No hay datos para los filtros seleccionados".
7. **Charts theming**:
   - Wrapper `<ThemedChart>` lee `useTheme()` y deriva colors de tokens HSL:
     - `--primary` → línea principal.
     - `--muted-foreground` → grid lines / axis.
     - `--destructive` → líneas negativas (sentiment < 0).
     - `--chart-1` … `--chart-5` (nuevos tokens) → series.
8. **Server Component carga inicial** con cache `'force-no-store'`:
   - 1 query agregada: últimos 100 snapshots del user para las URLs filtradas, en el date range.
   - Devuelve shape: `{ snapshots, urls, dateRange }`.
9. **Client Component recharts** que recibe data inicial + maneja filter changes con `useTransition` + `router.replace(searchParams)`.
10. **i18n** namespaces nuevos:
    - `Analytics.Filters` (urls, dateRange, granularity).
    - `Analytics.Charts.ScoreEvolution`, `.SubScores`, `.Tracking`, `.Keywords`, `.Sentiment`.
    - `Analytics.Table` (columns, empty).
    - `Analytics.Comparison` (button label, drawer title, sections).
    - `Analytics.Empty` (notEnoughData, noMatch, runAuditCTA).
11. **Dep nueva**: `recharts ^2.13.0`.
12. **Nuevos tokens CSS**:
    - `--chart-1` a `--chart-5` (5 colores distintos para series). Light + dark.

### No-objetivos (out-of-scope explícito)

- **No** export a CSV/PDF — futuro change.
- **No** sharing público de dashboards (signed URLs, embeds) — futuro.
- **No** AI insights / recommendations — futuro change separado.
- **No** comparación entre múltiples (>2) snapshots simultáneos — solo 2-way.
- **No** custom date range picker libre — solo presets fijos.
- **No** drill-down desde un chart a un snapshot — link en la tabla es suficiente.
- **No** alertas / notificaciones por umbrales — futuro.
- **No** multi-tenancy / sharing entre usuarios.
- **No** widgets re-orderables (dashboard "personalizable") — layout fijo.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Recharts agrega ~120KB al bundle | Lazy-load del client component con `dynamic(() => import('./AnalyticsClient'))` + `loading: <Skeleton>`. |
| Charts en mobile son ilegibles | ResponsiveContainer + minHeight 280px + tooltip touch-friendly. |
| Query devuelve 100 rows pesados (jsonb completo) | SELECT específico con `result->>'keywords'` y `result->>'sentiment'` extractions (jsonb path expressions). No traer el result completo a menos que sea necesario. |
| Date range custom no implementado → users pueden querer rangos específicos | Aceptado para mvp. Documentar como futuro. |
| User con 100 audits del mismo URL → chart denso | Aggregation server-side por granularidad (day/week/month con `date_trunc`). |
| User con < 3 snapshots → charts vacíos sin contexto | Empty state explícito con CTA. |
| Color blindness en charts (5 series indistinguibles) | Paleta usa hue + lightness distintos (no solo hue). Documentar en design. |
| Comparison `Sheet` overflows en mobile | mvp: `Sheet` con `side="bottom"` en mobile, `side="right"` en desktop (CSS media query). |

## Métricas de éxito

- Página carga inicial < 1s con 30 snapshots (Server Component + lazy client).
- Cambio de filtro re-render < 300ms.
- Lighthouse a11y ≥ 0.90.
- 5 charts navegables con teclado (Recharts aria-label nativo).
- Cross-user data leak: cero (RLS verificado).
- Dark mode visualmente correcto (colors derivados de tokens HSL).

## Referencias

- Spec activa: [`openspec/specs/dashboard-web/spec.md`](../../specs/dashboard-web/spec.md).
- Recharts docs: https://recharts.org/
- jsonb path en Postgres: https://www.postgresql.org/docs/current/functions-json.html
