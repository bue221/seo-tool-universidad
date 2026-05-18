# Proposal: audit-runner

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-18
**Depends on:**
- [`web-foundation`](../archive/web-foundation/) (archived) — i18n, SEO, env.
- [`ui-foundation`](../archive/ui-foundation/) (archived) — Form, Card, Tabs, Skeleton.
- [`auth-foundation`](../auth-foundation/) (proposed) — `getCurrentUser()`, rutas `(protected)/`.
- [`scraper-foundation`](../scraper-foundation/) (proposed) — endpoint `POST /api/audit` que respeta [`audit-contract`](../../specs/audit-contract/spec.md).
- [`audit-contract`](../../specs/audit-contract/spec.md) (active) — shape JSON inmutable.

---

## ¿Por qué?

`audit-runner` es el **primer feature de producto** del proyecto. Hasta aquí las foundations: i18n, theme, SEO, UI, auth. Aquí amarramos todo en lo que el usuario realmente vino a hacer: **auditar una URL** y obtener un reporte unificado de PageSpeed + scraper + análisis de keywords + sentiment.

Sin este change, las foundations no se justifican — es como tener cocina, electricidad y mesas en un restaurante sin platos en el menú.

Además resuelve la promesa académica:
- **Google Insights** real (PageSpeed API, gratis).
- **Detección de GTM/GA4/Ads** (vía scraper).
- **Análisis SemRush-style** (densidad de keywords).
- **Sentiment** del contenido competitivo.

## ¿Qué?

### Alcance (in-scope)

1. **Página form** `/[locale]/(protected)/audit` con:
   - Input URL + Submit ("Auditar") usando `Form` + `FormField` + `Input` + `Button`.
   - Validación zod (URL absoluta http/https, longitud ≤ 2000).
   - Listado histórico debajo del form: últimos 10 snapshots del usuario actual (Card por snapshot con URL + globalScore + fetchedAt + link a detail).

2. **Server action `runAudit(formData)`** que:
   - Valida URL con zod.
   - En **paralelo** con `Promise.allSettled`:
     - Fetch a Google PageSpeed Insights API mobile strategy.
     - Fetch a `POST ${SCRAPER_API_URL}/api/audit`.
   - Si **ambos fallan**, devuelve `{ ok: false, error: { code: 'UPSTREAM_BOTH_FAILED' } }`.
   - Si **uno falla**, devuelve resultado parcial con `partialFailure: { pagespeed?, scraper? }`.
   - Si **ambos OK**, calcula `globalScore` con la fórmula ponderada.
   - Inserta en tabla `seo_snapshots` con `user_id` desde `getCurrentUser()`.
   - Hace `revalidatePath('/[locale]/(protected)/audit')`.
   - Retorna `{ ok: true, snapshotId }`.

3. **Esquema Supabase**:
   - Tabla `public.seo_snapshots` con RLS por `user_id`.
   - Migración `0002_seo_snapshots.sql`.

4. **Página detail** `/[locale]/(protected)/audit/[snapshotId]`:
   - Server Component — fetch del snapshot del usuario actual (RLS asegura ownership).
   - Card grande con `globalScore` (número 0–100 + badge color-coded).
   - `Tabs` con 5 paneles:
     - **PageSpeed:** Performance, Accessibility, Best Practices, SEO scores (radial chart o number + badge).
     - **On-Page:** title, meta description (con `lengthScore`), h1 count, alt coverage.
     - **Tracking:** GTM detected (Badge), GA4 detected, Google Ads detected. IDs encontrados (lista).
     - **Keywords:** top 5 con `density` (progress bar) + word cloud simple.
     - **Sentiment:** polarity (Badge color-coded), score (-1 a 1).
   - Si `partialFailure` en algún área, mostrar `Card` destructive variant con "Esta sección falló: <error>". El resto se sigue mostrando.

5. **Sub-componentes** en `src/app/[locale]/(protected)/audit/_components/`:
   - `AuditForm.tsx` (Client Component con react-hook-form).
   - `AuditHistoryList.tsx` (Server Component).
   - `ScoreBadge.tsx` (color según rango: rojo 0–49, amarillo 50–79, verde 80–100).
   - `PageSpeedSection.tsx`, `OnPageSection.tsx`, `TrackingSection.tsx`, `KeywordsSection.tsx`, `SentimentSection.tsx`.

6. **Estados visuales**:
   - Loading: `Skeleton` cards en cada sección.
   - Error parcial: `Card` con borde destructive + mensaje específico + botón retry.
   - Error total: `Card` destructive grande + retry global.
   - Success: secciones populadas.

7. **i18n**: namespaces nuevos:
   - `Audit.Form` (label, placeholder, submit, validation errors).
   - `Audit.History` (empty, item description).
   - `Audit.Result.Common` (globalScore, fetchedAt, viewDetails).
   - `Audit.Sections.PageSpeed`, `.OnPage`, `.Tracking`, `.Keywords`, `.Sentiment`.
   - `Audit.Errors` (códigos: TIMEOUT, UPSTREAM_PAGESPEED, UPSTREAM_SCRAPER, UPSTREAM_BOTH_FAILED, INVALID_URL, UNAUTHORIZED).

8. **Env vars nuevas** (server-only):
   - `PAGESPEED_API_KEY` (opcional pero recomendado — sin key hay rate limit duro).
   - `SCRAPER_API_URL` (URL del scraper deployado).
   - Validar con zod en `serverEnv` (schema de `auth-foundation`).

### No-objetivos (out-of-scope explícito)

- **No** comparar 2 sitios — `analytics-dashboard` lo cubre parcialmente.
- **No** exportar a PDF — futuro change.
- **No** programar audits recurrentes — futuro change.
- **No** análisis competitivo profundo — `analytics-dashboard` trae tendencias.
- **No** webhooks ni email al terminar — futuro.
- **No** cancelación de audit en curso — futuro (el timeout 35s lo limita).
- **No** retry automático — el usuario hace click en "retry" botón.
- **No** caché de resultados — cada audit es fresh.
- **No** mostrar HTML raw del sitio auditado — solo metrics derivados.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| PageSpeed API rate limit (sin key: 1 req/s; con key: 25k/día) | Documentar setear `PAGESPEED_API_KEY` para prod. Sin key, la app sigue funcionando con resultado parcial si rate limit pega. |
| Scraper-api caído / lento | Timeout duro 30s en fetch (matchea SLA del scraper-api). `Promise.allSettled` permite mostrar resultado parcial. |
| Usuario abusa: 100 audits/min para misma URL | No hay rate limit en este change (futuro). Aceptado para mvp académico. |
| Snapshot insertado pero render falla → snapshot huérfano | OK — queda en historial, usuario puede acceder en próximos visitas a `/audit`. |
| URL malicioso (XSS por reflejar en página) | React escapa por default. `target` query-string sanitizado por validación zod. |
| Concurrencia: dos audits paralelos de mismo user a misma URL | Permitido. Cada uno crea su snapshot. El histórico mostrará ambos. Aceptado. |
| Cookies de Supabase no llegan al fetch del scraper | El scraper no requiere auth — el endpoint es público. |
| Errores de PageSpeed JSON (campos faltantes en respuesta) | Validar con zod la respuesta de PageSpeed. Si schema falla, `partialFailure.pagespeed = 'INVALID_RESPONSE'`. |

## Métricas de éxito

- p50 ≤ 8s, p95 ≤ 20s para audits típicos.
- Cero data leak entre usuarios (RLS verificado en smoke).
- Auditar `https://example.com` produce snapshot con `globalScore` numérico válido y los 5 paneles populados.
- Si scraper-api está caído, el audit muestra resultado parcial de PageSpeed + mensaje "scraper no disponible" — no falla todo.
- Lighthouse a11y ≥ 0.90 en `/audit` y `/audit/[id]` en ambos temas.
- Bundle size first-load JS de `/audit/[id]` ≤ 250KB (con recharts excluido — no se usa en este change).

## Referencias

- [`audit-contract`](../../specs/audit-contract/spec.md) — contrato JSON inmutable que consumimos.
- Docs PageSpeed: https://developers.google.com/speed/docs/insights/v5/get-started
