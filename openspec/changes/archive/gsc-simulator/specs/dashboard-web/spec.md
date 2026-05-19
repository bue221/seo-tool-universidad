# Delta dashboard-web: gsc-simulator

**Target spec:** `openspec/specs/dashboard-web/spec.md`
**Bump:** v0.2.0 → v0.3.0
**Operación:** ADD

---

## ADDED — Sección "Search Console" (simulada)

### Routes protegidas

```
/[locale]/gsc                              → landing, lista propiedades del usuario
/[locale]/gsc/[property]/overview          → KPIs + time series
/[locale]/gsc/[property]/queries           → top 50 queries
/[locale]/gsc/[property]/pages             → top 50 pages
/[locale]/gsc/[property]/devices           → distribución por device
/[locale]/gsc/[property]/countries         → top 20 países
```

Todas requieren sesión autenticada (heredan `(protected)` group).

### Propiedades

- Las propiedades del usuario se derivan de `SELECT DISTINCT url FROM seo_snapshots WHERE user_id = $1`.
- **Sin tablas nuevas.** El módulo es read-only sobre `seo_snapshots`.
- Si el usuario no tiene snapshots, `/gsc` muestra CTA hacia `/audit`.
- Acceder a `/gsc/[property]/*` con un dominio que no pertenece al usuario → 404.

### Datos

- Generados server-side por `src/lib/gsc/generator.ts` mediante PRNG `mulberry32` sembrado con SHA-256(dominio).
- **Determinismo garantizado**: mismo dominio + mismo range → respuesta byte-identical.
- Sin persistencia: cada request regenera el dataset.
- Rangos soportados: 7, 28, 90 días (vía search param `?range=`).

### Shape público

`getGscDataset(domain, range): Promise<GscDataset>` exporta:

- `totals` y `previousPeriodTotals` con `{ clicks, impressions, ctr, position }`.
- `series` con un punto por día (length = range).
- `queries[50]`, `pages[50]`, `devices[3]`, `countries[20]`.

### Invariantes obligatorias

- `clicks ≤ impressions` por cada fila.
- `ctr ∈ [0, 1]`, `position ∈ [1, 100]`.
- `series.length === range`.
- `devices.length === 3` (mobile/desktop/tablet).
- `queries.length === 50`, `pages.length === 50`, `countries.length === 20`.

### i18n

Namespaces añadidos en `messages/{en,es}.json`:

- `GSC.Common`
- `GSC.Landing`
- `GSC.Overview`
- `GSC.Queries`
- `GSC.Pages`
- `GSC.Devices`
- `GSC.Countries`

### Out-of-scope (negativo explícito)

- No OAuth ni Search Analytics API real.
- No persistencia de datos generados.
- No sección Coverage ni Sitemaps.
- No flujo de verificación de propiedad.
- No comparación cruzada entre propiedades.

---

## Cambios de UI shell

- Nav sidebar protegido: nuevo item "Search Console" con icono `Search` (lucide) entre "Analytics" y "GBP".
