# Delta: dashboard-web @ analytics-dashboard

> **Convención OpenSpec:** este archivo describe cambios incrementales contra
> [`openspec/specs/dashboard-web/spec.md`](../../../../specs/dashboard-web/spec.md)
> (v0.5.0 después de `gbp-simulator`).

---

## ADDED — Capability: Analytics Dashboard

### Propósito

Vista histórica de auditorías del usuario sobre la tabla `seo_snapshots` (creada por `audit-runner`). Permite:

- Ver tendencias en el tiempo (score global, sub-scores, tracking, keywords, sentiment).
- Filtrar por URL, rango de fechas, granularidad.
- Comparar 2 snapshots side-by-side.

### Data sources

- `seo_snapshots` (de `audit-runner`).
- Queries server-side con `createClient()` (RLS asegura aislamiento).
- Sin cache cliente — `'force-no-store'` en Server Component fetch.

### Charts

| Chart | Tipo Recharts | Source | Notas |
|-------|---------------|--------|-------|
| Score evolution | `LineChart` | `getBucketedData()` | 1 línea por URL seleccionada. |
| Sub-scores breakdown | `ComposedChart` | `getBucketedData()` | 4 líneas (performance, on-page, tracking, sentiment) para URL primaria. |
| Tracking over time | `BarChart` stacked | `getBucketedData()` | 3 bars apilados (GTM/GA4/Ads). |
| Top keywords trend | `AreaChart` stacked | `getKeywordsTrend()` | Top 5 keywords con density. |
| Sentiment trend | `LineChart` | `getBucketedData()` | Polarity score (-1 a 1). |

Todos los charts:

- Wrapped en `<ThemedChart>` (`ResponsiveContainer` + `minHeight: 280px`).
- Colors derivados de tokens HSL `--chart-1..5` (light/dark switcheable).
- `aria-label` nativo de Recharts → keyboard-navigable.

### Filtros

| Filtro | Tipo | Default |
|--------|------|---------|
| URLs | Multi-select (DropdownMenuCheckboxItem) | La URL más recientemente auditada. |
| Rango | Single-select ToggleGroup | `30d` |
| Granularidad | Single-select | `day` para ≤30d, `week` para ≤6m, `month` para >6m (toggleable). |

Filter state vive en URL search params (`?urls=...&range=...&gran=...`) — bookmark-able + back/forward funcionan.

### Snapshots table

- HTML `<table>` semántico + Tailwind styling.
- Limit 100 últimos en el rango.
- Sin paginación en mvp.
- Columnas: checkbox (selección), fecha, url, global_score (Badge color), sentiment_polarity (Badge), link a `/audit/[id]`.

### Comparison

- Activado al seleccionar exactamente 2 rows en la table.
- Floating button "Comparar (N/2)" en la esquina inferior derecha.
- Click → `Sheet` lateral (right desktop, bottom mobile) con side-by-side.
- Diffs: ↑/↓ + delta numérico + color (verde subió, rojo bajó).
- Mostrar: globalScore, 4 sub-scores, top 5 keywords (común a ambos), sentiment polarity.

### Empty states

| Caso | UI |
|------|----|
| User con 0 snapshots | Card grande con CTA "Realizar primera auditoría" → `/audit`. |
| User con < 3 snapshots | Card con "Necesitas al menos 3 auditorías. Tienes: N" + CTA. |
| Filtros sin matches | Card pequeña con "Sin datos para los filtros" + botón "Resetear". |

### Tokens CSS adicionales

```
--chart-1 (azul)     · derivado para series principales
--chart-2 (verde)    · series secundarias
--chart-3 (naranja)
--chart-4 (púrpura)
--chart-5 (rojo)
```

Paleta diseñada para diferenciarse por hue + lightness (color blindness-aware).

### Public surface (auditada)

| Endpoint | Status | Contenido |
|----------|--------|-----------|
| `GET /(protected)/analytics` | 200 (auth) / redirect login (no sesión) | Dashboard charts + table. |
| `GET /(protected)/analytics?urls=...&range=...&gran=...` | 200 | Mismo con filtros aplicados. |

### Invariantes nuevas

25. **`analytics-dashboard` LEE de `seo_snapshots`** pero nunca escribe. Snapshots se crean solo en `audit-runner`.
26. **Charts respetan tokens HSL del theme**. Cambio a dark → colores recalculan sin recargar página.
27. **Filtros viven en URL search params**, no en `useState` puro. Bookmark + back/forward respetados.
28. **Recharts cargado lazy** (`next/dynamic`). Página inicial muestra `<Skeleton>` hasta hidratar.
29. **SQL queries usan `date_trunc`** para agregación server-side. No traer 1000+ rows al cliente.
30. **Comparison limitada a 2 snapshots**. Seleccionar el 3ro deselecciona el 1ro.

---

## MODIFIED — Capability: Public surface

### Endpoints agregados

| Endpoint | Status | Contenido |
|----------|--------|-----------|
| `GET /(protected)/analytics`, `/en/(protected)/analytics` | 200 / 307 | Dashboard. |

---

## Verificación

Spec satisfecha cuando ✓:

- [ ] `recharts` agregado a `package.json` y `pnpm install` exitoso.
- [ ] Tokens `--chart-1..5` en `globals.css` (light + dark).
- [ ] Tests `aggregation.test.ts` y `url-params.test.ts` verdes.
- [ ] Smoke checklist analytics pasa: 5 charts populados, comparison, empty states, dark mode.
- [ ] Lighthouse a11y ≥ 0.90 en `/analytics` light + dark.
- [ ] Bundle: first-load JS con chart bundle lazy < 220KB sin recharts; con recharts hidratado < 340KB.

---

## Histórico de cambios

| Versión | Fecha       | Cambio | Source |
|---------|-------------|--------|--------|
| v0.6.0  | (al archivar)  | ADDED Capability Analytics Dashboard (5 charts + table + comparison + filtros URL state). MODIFIED Public surface (1 ruta). | [`changes/archive/analytics-dashboard/`](../../../changes/archive/analytics-dashboard/) |
