# Delta: dashboard-web @ audit-runner

> **Convención OpenSpec:** este archivo describe cambios incrementales contra
> [`openspec/specs/dashboard-web/spec.md`](../../../../specs/dashboard-web/spec.md)
> (v0.3.0 después de `auth-foundation`).

---

## ADDED — Capability: Audit Runner

### Input

- URL absoluta http/https, validada con zod (`z.string().url().refine(http|https)`).
- Longitud ≤ 2000 chars (matchea check constraint en DB).
- Source: formulario en `/[locale]/(protected)/audit` con `react-hook-form + zodResolver`.

### Flujo

1. **Validación** de URL en server action `runAudit`.
2. **Autorización**: `getCurrentUser()` (del `auth-foundation`). Si null → `{ ok: false, error: { code: 'UNAUTHORIZED' } }`.
3. **Fetch paralelo** con `Promise.allSettled`:
   - `fetchPageSpeed(url)` — Google PageSpeed Insights API mobile + 4 categorías.
   - `fetchScraper(url)` — `POST ${SCRAPER_API_URL}/api/audit` (respeta [`audit-contract`](../../../../specs/audit-contract/spec.md)).
4. **Timeout total** del runAudit: 35s (5s más que el SLA de scraper, para overhead).
5. **Cálculo del `globalScore`** con fórmula ponderada (ver más abajo).
6. **Tracking de `partialFailure`** si alguno de los fetches devolvió error o data inválida.
7. **Persistencia**: insert en `public.seo_snapshots` con `user_id` del current user.
8. **`revalidatePath`** del histórico.
9. **Redirect** del cliente a `/audit/[snapshotId]` (via `redirect` localizado).

### Fórmula `globalScore`

Pesos por default:

```
pagespeed.performance = 0.40
pagespeed.seo         = 0.20
onPage                = 0.20
tracking              = 0.10
sentiment             = 0.10
```

Sub-scores normalizados a 0-100:

- `onPage = (title.lengthScore + meta.lengthScore + images.altCoverage + (h1.count === 1 ? 1 : 0)) / 4 * 100`
- `tracking = (gtm + ga4 + googleAds counts detected) / 3 * 100`
- `sentiment = ((scrSentiment.score + 1) / 2) * 100` (rango original `-1..1` → `0..100`)

**Renormalización en partial failure:**

- Si **pagespeed** missing: pesos sobrevivientes `{onPage: 0.50, tracking: 0.25, sentiment: 0.25}` sobre la suma 0.40.
- Si **scraper** missing: solo PageSpeed disponible. `globalScore = pagespeedPerformance * 0.667 + pagespeedSeo * 0.333`.

### Persistence schema

Tabla `public.seo_snapshots`:

| Columna | Tipo | Constraint |
|---------|------|-----------|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | FK `auth.users(id)` ON DELETE CASCADE, NOT NULL |
| `url` | `text` | NOT NULL, `char_length ≤ 2000` |
| `result` | `jsonb` | NOT NULL — shape `AuditResult` |
| `global_score` | `numeric(5,2)` | NOT NULL, check 0–100 |
| `partial_failure` | `jsonb` | nullable — `{ pagespeed?: string; scraper?: string }` |
| `fetched_at` | `timestamptz` | NOT NULL DEFAULT now() |

Índices:

- `(user_id, fetched_at desc)` — listado histórico.
- `(user_id, url, fetched_at desc)` — analytics-dashboard agrupado por URL.

### RLS

| Policy | Acción | Condición |
|--------|--------|-----------|
| `users read own snapshots` | SELECT | `auth.uid() = user_id` |
| `users insert own snapshots` | INSERT | WITH CHECK `auth.uid() = user_id` |

No hay UPDATE ni DELETE — snapshots son inmutables.

### Retry strategy

- **No retry automático.** El form muestra error y botón "Reintentar" que dispara nueva server action.
- Razón: PageSpeed tiene rate limit; retries automáticos amplifican el problema.

### Sub-secciones del detail

Las 5 secciones del detail (Tabs):

1. **PageSpeed**: scores 0-100 de Performance / Accessibility / Best Practices / SEO. Métricas (FCP, LCP, CLS, TBT) cuando estén.
2. **On-Page**: title con `lengthScore`, meta description con `lengthScore`, h1 count + value, alt coverage (`altCoverage` 0-1 → progress).
3. **Tracking**: GTM, GA4, Google Ads detected (Badge) + IDs.
4. **Keywords**: top 5 con `density` (progress bar).
5. **Sentiment**: polarity (Badge color-coded), score, interpretación textual.

Cada sección revisa `partialFailure[origen]` y renderiza fallback destructive si aplica.

### Public surface (auditada)

| Endpoint | Status | Contenido |
|----------|--------|-----------|
| `GET /(protected)/audit` | 200 (auth) / redirect login | Form + history list |
| `GET /(protected)/audit/[id]` | 200 (auth + RLS) / 404 (no es del user) | Detail con 5 secciones |
| `POST` server action `runAudit` | `{ ok, snapshotId? } \| { ok: false, error }` | Backend orquestación |

### Invariantes nuevas

16. **Server action `runAudit` es la ÚNICA forma de crear snapshots.** No insertar directamente desde Client Components.
17. **Snapshots son inmutables.** No hay UPDATE policy en `seo_snapshots`.
18. **`globalScore` es siempre 0–100** (check constraint en DB).
19. **`partial_failure` documenta qué upstream falló.** Permite re-procesar después con un job (futuro change).
20. **El detail page nunca muestra HTML/contenido raw del sitio auditado** — solo metrics derivados (privacy del usuario auditado).

---

## MODIFIED — Capability: Environment configuration

### Variables agregadas a `serverEnvSchema`

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `PAGESPEED_API_KEY` | string opcional (min 20 chars si presente) | undefined | Google PageSpeed Insights API key. Sin key: rate limit duro 1 req/s. |
| `SCRAPER_API_URL` | URL absoluta (sin trailing slash) | — | URL del scraper-api deployado. Requerido. |

---

## MODIFIED — Capability: Public surface

### Endpoints agregados

| Endpoint | Status | Contenido |
|----------|--------|-----------|
| `GET /(protected)/audit`, `/en/(protected)/audit` | 200 / 307 a `/login` | Form + history |
| `GET /(protected)/audit/[snapshotId]`, `/en/...` | 200 / 404 / 307 | Detail |

---

## Verificación

Spec satisfecha cuando ✓:

- [ ] `pnpm test` pasa tests de `score.test.ts`, `pagespeed.test.ts`, `scraper.test.ts`.
- [ ] Migration `0002_seo_snapshots.sql` aplicada.
- [ ] Smoke checklist `SMOKE.md` audit section pasa: auditar, parcial failure, RLS, retry.
- [ ] p50 ≤ 8s, p95 ≤ 20s en audits con scraper deployado.
- [ ] Bundle first-load JS de `/audit/[id]` ≤ 250KB.
- [ ] Lighthouse a11y ≥ 0.90 en `/audit` y `/audit/[id]` en ambos temas.

---

## Histórico de cambios

| Versión | Fecha       | Cambio | Source |
|---------|-------------|--------|--------|
| v0.4.0  | (al archivar)  | ADDED Capability Audit Runner. MODIFIED Environment (2 vars). MODIFIED Public surface (2 rutas). | [`changes/archive/audit-runner/`](../../../changes/archive/audit-runner/) |
