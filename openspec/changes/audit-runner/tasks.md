# Tasks: audit-runner

> Marcar `[x]` al completar. Bloqueado por `auth-foundation` y `scraper-foundation`.

---

## 0. Pre-requisitos

- [ ] `auth-foundation` aplicado (DB + clientes + `getCurrentUser()` listos).
- [ ] `scraper-foundation` deployado (endpoint `POST /api/audit` accesible vía `SCRAPER_API_URL`).
- [ ] `PAGESPEED_API_KEY` provisionada (opcional pero recomendado).

## 1. Esquema Supabase

- [ ] `dashboard-web/supabase/migrations/0002_seo_snapshots.sql`:
  - Tabla `seo_snapshots` con FK a `auth.users`, check `global_score 0-100`, `partial_failure jsonb`.
  - RLS policies: read own, insert own (no UPDATE ni DELETE).
  - Index `(user_id, fetched_at desc)` y `(user_id, url, fetched_at desc)`.
- [ ] Aplicar migración. Verificar tabla en dashboard.

## 2. Env vars

- [ ] Extender `serverEnvSchema` en `src/lib/env.ts`:
  - `PAGESPEED_API_KEY` (string opcional, length min 20 si presente).
  - `SCRAPER_API_URL` (URL absoluta sin trailing slash).
- [ ] Actualizar `.env.local.example`.

## 3. Tipos y libs

- [ ] `src/lib/audit/types.ts` — `PageSpeedScores`, `AuditResult`, `PartialFailure`, etc.
- [ ] `src/lib/audit/pagespeed.ts` — `fetchPageSpeed(url): Promise<{ ok: true; data: PageSpeedScores } | { ok: false; error: PartialFailure['pagespeed'] }>`. Validación zod de respuesta.
- [ ] `src/lib/audit/scraper.ts` — `fetchScraper(url): Promise<{ ok, data?, error? }>`. Validación zod de la respuesta del audit-contract.
- [ ] `src/lib/audit/score.ts` — `calculateGlobalScore(input)` con renormalización.
- [ ] `src/lib/audit/persistence.ts`:
  - `saveSnapshot(userId, audit)` — INSERT.
  - `getSnapshot(snapshotId)` — SELECT con RLS (no necesitamos pasar user_id).
  - `listSnapshots(limit = 10)` — SELECT ordered desc.

## 4. Server action

- [ ] `src/app/[locale]/(protected)/audit/_actions/run-audit.ts`:
  - `'use server'`.
  - Validar URL con zod.
  - `getCurrentUser()`. Si null → `{ ok: false, error: { code: 'UNAUTHORIZED' } }`.
  - `Promise.allSettled([fetchPageSpeed(url), fetchScraper(url)])` con `AbortSignal.timeout(35000)`.
  - Si ambos fail → return error.
  - Calcular `globalScore` + `partialFailure`.
  - `saveSnapshot(user.id, audit)`.
  - `revalidatePath('/[locale]/(protected)/audit')`.
  - Retornar `{ ok: true, snapshotId }`.

## 5. Páginas

- [ ] `src/app/[locale]/(protected)/audit/page.tsx`:
  - Server Component.
  - `getCurrentUser()` ya gateado por layout.
  - Renderiza `<AuditForm>` + `<AuditHistoryList>`.
- [ ] `src/app/[locale]/(protected)/audit/[snapshotId]/page.tsx`:
  - Server Component.
  - `getSnapshot(params.snapshotId)`. Si null → `notFound()` (RLS bloquea snapshots de otros users).
  - `generateMetadata` con title traducido (ej. "Auditoría de example.com").
  - Renderiza score badge + Tabs con 5 secciones.

## 6. Sub-componentes

- [ ] `_components/AuditForm.tsx` — Client Component:
  - `useForm` + `zodResolver`.
  - `onSubmit` llama `runAudit(formData)`.
  - `useTransition` para `isPending`.
  - Toast feedback (`toast.loading` + `toast.success/error`).
  - On success: `router.push('/audit/' + snapshotId)`.
- [ ] `_components/AuditHistoryList.tsx` — Server Component:
  - Llama `listSnapshots(10)`.
  - Renderiza `Card` por snapshot con URL + globalScore + fetchedAt + link `next-intl/Link`.
  - Empty state si lista vacía.
- [ ] `_components/ScoreBadge.tsx` — Server Component:
  - Props: `score: number`.
  - Badge color según rango (rojo/amarillo/verde).
- [ ] `_components/PageSpeedSection.tsx` — Server Component:
  - 4 cards con number grandes + ScoreBadge.
  - FCP/LCP/CLS/TBT como list pequeña.
  - Si `partialFailure.pagespeed`, fallback destructive.
- [ ] `_components/OnPageSection.tsx`:
  - Title con lengthScore.
  - Meta description con lengthScore.
  - H1 count + value.
  - Alt coverage (progress bar).
- [ ] `_components/TrackingSection.tsx`:
  - 3 filas (GTM, GA4, Ads) con Badge detected/not detected + IDs encontrados.
- [ ] `_components/KeywordsSection.tsx`:
  - Top 5 keywords con density (progress bar).
- [ ] `_components/SentimentSection.tsx`:
  - Polarity (Badge), score numérico, interpretación.

## 7. i18n

- [ ] `messages/{es,en}.json` con namespaces:
  - `Audit.Form` (label, placeholder, submit, validation errors).
  - `Audit.History` (title, empty, item).
  - `Audit.Result.Common` (globalScore, fetchedAt, viewDetails, partialNotice).
  - `Audit.Sections.PageSpeed` (labels para los 4 scores + métricas).
  - `Audit.Sections.OnPage`.
  - `Audit.Sections.Tracking`.
  - `Audit.Sections.Keywords`.
  - `Audit.Sections.Sentiment`.
  - `Audit.Errors` (TIMEOUT, UPSTREAM_PAGESPEED, UPSTREAM_SCRAPER, UPSTREAM_BOTH_FAILED, INVALID_URL, UNAUTHORIZED, UNKNOWN).

## 8. Tests

- [ ] `src/lib/audit/score.test.ts` — fórmula globalScore con casos:
  - Todos los inputs presentes.
  - PageSpeed missing → renormalización.
  - Scraper missing → solo PageSpeed.
  - Edge: `sentiment.score = -1` → contribución 0.
- [ ] `src/lib/audit/pagespeed.test.ts` — mock fetch, validar parsing + handling de errors (404, 5xx, malformed).
- [ ] `src/lib/audit/scraper.test.ts` — mock fetch, validar parsing del audit-contract + errores.
- [ ] Test e2e manual (`SMOKE.md`):
  - Auditar `https://example.com` con scraper UP y PageSpeed con key.
  - Auditar con scraper DOWN — verifica resultado parcial.
  - Auditar con URL inválida — error de validación.
  - 2 usuarios distintos no ven snapshots del otro.

## 9. Documentación

- [ ] Actualizar `dashboard-web/README.md`:
  - Stack: agregar PageSpeed Insights consumer.
  - Cookbook receta: "consumir el audit-contract".
- [ ] Actualizar `dashboard-web/agents.md`:
  - Tabla de capacidades: agregar "Audit Runner".
  - Roadmap: marcar `audit-runner` activo.
- [ ] Actualizar `dashboard-web/SMOKE.md`:
  - Sección nueva: smoke auditoría (form, partial failure, RLS, navegación).

## 10. Cierre

- [ ] PR título: `feat(web): audit runner end-to-end [audit-runner]`.
- [ ] Validar specs: review manual del delta.
- [ ] Archive offline:
  - Promover delta a `openspec/specs/dashboard-web/spec.md` (v0.4.0).
  - Mover a `openspec/changes/archive/audit-runner/`.
- [ ] Actualizar `openspec/README.md` y `AGENTS.md` raíz.
