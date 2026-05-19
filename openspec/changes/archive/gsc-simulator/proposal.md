# Proposal: gsc-simulator

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-19
**Depends on:**
- [`auth-foundation`](../auth-foundation/) — usuario autenticado.
- [`audit-runner`](../audit-runner/) — necesitamos `seo_snapshots` para derivar "propiedades verificadas".
- [`ui-foundation`](../archive/ui-foundation/) — Card, Tabs, Table, Select, Badge.

---

## ¿Por qué?

El enunciado académico exige cubrir **Google Search Console**. La API real (Search Analytics) requiere:

1. Verificación de propiedad de dominio (DNS/HTML upload).
2. OAuth de usuario con scope `webmasters.readonly` y consent screen aprobado.
3. Una property activa con tráfico real ya recolectado por Google (no podés "demo-ear" sin tráfico orgánico previo).

Ninguna de las tres es viable en contexto académico. Misma postura que `gbp-simulator`: **simular estructuralmente**.

Ventajas:

- Cubre el requisito del enunciado con shape fiel a la API real.
- Demuestra entendimiento de las **dimensiones** y **métricas** de GSC (query, page, country, device × clicks/impressions/CTR/position).
- Datos deterministas por dominio → la demo es reproducible.
- Cuando el profesor pregunta "¿esto trae datos reales?" la respuesta honesta es "es estructural; la integración real es un OAuth flow documentado en design.md".

## ¿Qué?

### Alcance (in-scope)

1. **Sin tablas nuevas en Supabase.** Las "propiedades" del usuario se derivan de `SELECT DISTINCT url FROM seo_snapshots WHERE user_id = $1`. Esto refuerza el flujo "auditá primero → después mirá GSC".

2. **Generador determinista** `src/lib/gsc/generator.ts`:
   - Input: `{ domain: string, rangeDays: 7 | 28 | 90, seed?: string }`.
   - Seed default: SHA-256(domain) → semilla para `mulberry32` PRNG.
   - Output: dataset completo con queries, pages, devices, countries y series temporales diarias.
   - **Determinismo verificable**: mismo dominio → mismos números, snapshot tests obligatorios.

3. **5 páginas** en `/[locale]/(protected)/gsc/`:
   - `/gsc` — landing: si el usuario no tiene snapshots → CTA a `/audit`. Si tiene → grid de "propiedades" con resumen (clicks/impressions/CTR/position últimos 28d).
   - `/gsc/[property]/overview` — KPIs grandes + line chart (clicks/impressions por día) + sparkline CTR + sparkline position. Selector de rango 7/28/90.
   - `/gsc/[property]/queries` — tabla paginada top 50 queries con sort por cada métrica.
   - `/gsc/[property]/pages` — tabla paginada top 50 páginas internas con sort.
   - `/gsc/[property]/devices` — donut + tabla mobile/desktop/tablet.
   - `/gsc/[property]/countries` — tabla top 20 países con bandera emoji + métricas.

4. **Encoding del param `[property]`**: URL encoded del dominio (`example.com` → `example.com`, `https://sub.example.com/path` → `https%3A%2F%2Fsub.example.com%2Fpath`). Validación server-side: el dominio debe existir en los `seo_snapshots` del usuario actual o devuelve 404.

5. **Componentes**:
   - `PropertyCard.tsx` — usado en landing.
   - `RangeSelector.tsx` — toggle 7d/28d/3m.
   - `MetricCards.tsx` — 4 KPIs (clicks, impressions, CTR, position) con delta vs período anterior.
   - `TimeSeriesChart.tsx` — Recharts line, reutilizado de `analytics-dashboard` si está implementado, si no se crea acá.
   - `DimensionTable.tsx` — tabla sortable genérica para queries/pages/countries.
   - `DevicesDonut.tsx` — Recharts pie.

6. **Reglas del generador** (documentadas en `design.md`):
   - Total impressions ~ función del largo del dominio (PRNG bounded 1000–50000 por día).
   - CTR realista: 1–15% (queries de marca más altos, no-marca más bajos).
   - Position: 1–100, queries con "más palabras" tienden a position mejor (heurístico inverso a la real, pero plausible).
   - Distribución por device: ~60% mobile / 35% desktop / 5% tablet (jitter ±5%).
   - Distribución por país: zip dominio TLD (`.es` → mayormente ES, `.co` → CO, `.com` → mix global con US dominante).

7. **i18n**: namespace nuevo `GSC.*`:
   - `GSC.Common`, `GSC.Landing`, `GSC.Overview`, `GSC.Queries`, `GSC.Pages`, `GSC.Devices`, `GSC.Countries`.

8. **Nav**: nuevo item "Search Console" en sidebar protegido entre `Analytics` y `GBP`.

### No-objetivos

- **No** OAuth ni Search Analytics API real.
- **No** persistencia de las series generadas (cada request las regenera con el mismo seed → idéntico).
- **No** export CSV.
- **No** comparación entre propiedades.
- **No** filtros por query (regex/contains) en mvp.
- **No** sección "Coverage" ni "Sitemaps" — solo Performance (que es la pestaña que importa para el enunciado).
- **No** ownership verification flow (HTML upload, DNS TXT) — fuera de scope.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Profesor pregunta si los datos son reales | `design.md` documenta explícitamente la simulación y el path de integración real con Search Analytics API. |
| Un dominio sin snapshots intenta acceder a `/gsc/[property]` directo | Validación server-side: 404 si no está en `seo_snapshots` del usuario. |
| Los datos sintéticos parecen "demasiado redondos" | PRNG con seed garantiza distribución variada y plausible. Snapshot tests validan distribución (no constantes). |
| Generar 90 días × 50 queries × 50 pages → render lento | Generación O(rangeDays + dimensions). Total ≤ 200 + 50 + 50 + 3 + 20 = ~325 filas. Sin problema. |
| Componentes duplican lógica de Recharts ya en `analytics-dashboard` | design.md decide: extraer a `src/components/charts/` si ambos changes están vivos. |

## Métricas de éxito

- Determinismo: ejecutar `getGscData("example.com", 28)` 100 veces → resultados byte-identical.
- 5 páginas renderizan en < 200ms server-side (sin red, sin Supabase salvo la query inicial de propiedades).
- Lighthouse a11y ≥ 0.90 en todas las páginas /gsc/* en ambos temas.
- Snapshot tests verifican shape y rangos de magnitud (clicks > 0, CTR ∈ [0, 1], position ∈ [1, 100]).
- Zero nuevas tablas en Supabase → cero migraciones.

## Referencias

- [Search Analytics API docs](https://developers.google.com/webmaster-tools/v1/searchanalytics) — fuente del shape simulado.
- Patrón hermano: [`gbp-simulator`](../gbp-simulator/).
