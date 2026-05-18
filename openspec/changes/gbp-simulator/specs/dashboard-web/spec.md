# Delta: dashboard-web @ gbp-simulator

> **Convención OpenSpec:** este archivo describe cambios incrementales contra
> [`openspec/specs/dashboard-web/spec.md`](../../../../specs/dashboard-web/spec.md)
> (v0.4.0 después de `audit-runner`).

---

## ADDED — Capability: GBP Simulator

### Filosofía

- **Simulación estructural** de Google Business Profile. La API real requiere verificación de negocio físico, fuera del alcance académico.
- **Estructura fiel** a la API real: mapping documentado en design.md. Migración futura a la API real es factible.
- **Datos en Supabase** con RLS jerárquica (un user = un business profile = N posts = N reviews).

### Restricciones de modelo

- **1 user = 1 business profile** (unique constraint en `user_id`).
- **Sin upload de fotos** (mvp).
- **Reviews inputadas manualmente** — no provienen de un sistema real.
- **Hours simplificados**: un bloque `{ open, close }` por día o `null` (cerrado). Sin split shifts.

### Esquema

| Tabla | Columnas clave |
|-------|----------------|
| `business_profiles` | `id`, `user_id` (FK + unique), `business_name`, `category`, `description`, `address`, `phone`, `website_url`, `hours jsonb`, `created_at`, `updated_at` (trigger). |
| `business_posts` | `id`, `profile_id` (FK), `title`, `body`, `cta_label?`, `cta_url?`, `published_at`. |
| `business_reviews` | `id`, `profile_id` (FK), `author_name`, `rating` (1-5 check), `body`, `response?`, `reviewed_at`, `responded_at?`. |

### RLS

| Tabla | Policy | Condición |
|-------|--------|-----------|
| `business_profiles` | ALL | `auth.uid() = user_id` |
| `business_posts` | ALL | `profile_id IN (SELECT id FROM business_profiles WHERE user_id = auth.uid())` |
| `business_reviews` | ALL | mismo patrón que posts |

### Operaciones (server actions)

| Action | Input | Notas |
|--------|-------|-------|
| `upsertProfile(formData)` | Profile fields + hours | UPSERT (INSERT si no existe, UPDATE si sí). |
| `createPost(formData)` | title, body, cta_label?, cta_url? | INSERT. |
| `deletePost(postId)` | postId | DELETE (RLS asegura ownership). |
| `createReview(formData)` | author_name, rating, body | Review simulada manual. |
| `addReviewResponse(reviewId, formData)` | response text | UPDATE response + responded_at = now(). |

Todas retornan `{ ok, error?, data? }` o lanzan `redirect()`.

### Cálculo de impacto de keywords locales

En `/gbp/insights`:

1. Tokenizar `business_profiles.description` + todos los `business_posts.body` del user.
2. Helper `src/lib/text.ts`:
   - `tokenize(text)` — Unicode-aware, lowercase, no-punct.
   - `removeStopWords(tokens)` — filtra ES+EN stop-words + tokens ≤2 chars.
   - `keywordDensity(tokens, topN)` — devuelve top N por `density`.
3. **Comparativa con scraper** (si hay `seo_snapshots` reciente para `website_url`):
   - `coincidences`: keywords que aparecen en ambos (posts del user Y scraper del sitio).
   - `gaps`: keywords del scraper que no aparecen en posts (oportunidad de contenido).
   - `onlyInPosts`: keywords del user que no aparecen en el sitio (potencial inconsistencia).
4. Si no hay snapshot, CTA "Ejecutar nueva auditoría" linkea a `/audit`.

### Public surface

| Endpoint | Status | Contenido |
|----------|--------|-----------|
| `GET /(protected)/gbp`, `/en/...` | 200 (con profile) → `redirect` a `/profile`. 200 (sin profile) → CTA crear. | Landing. |
| `GET /(protected)/gbp/profile`, `/en/...` | 200 | Form CRUD profile. |
| `GET /(protected)/gbp/posts`, `/en/...` | 200 | Listado + crear post. |
| `GET /(protected)/gbp/reviews`, `/en/...` | 200 | Listado + crear review + response. |
| `GET /(protected)/gbp/insights`, `/en/...` | 200 | Métricas. |

Todas requieren sesión (gated por layout `(protected)/`).

### Invariantes nuevas

21. **1 profile por user.** Constraint en DB + handling en UI (upsert en vez de insert).
22. **Tokenización TS no es bit-equivalent con la Go del scraper.** Aceptado — contextos distintos. Documentado en design.
23. **Helper `src/lib/text.ts` es la única forma de tokenizar texto en cliente.** No reimplementar inline.
24. **Stop-words list combinada ES+EN.** Si se agrega un locale futuro, extender `STOPWORDS_COMBINED`.

---

## MODIFIED — Capability: Public surface

### Endpoints agregados

| Endpoint | Status | Contenido |
|----------|--------|-----------|
| `GET /(protected)/gbp`, `/en/(protected)/gbp` | 200 / 307 | Landing |
| `GET /(protected)/gbp/profile` | 200 | Profile form |
| `GET /(protected)/gbp/posts` | 200 | Posts |
| `GET /(protected)/gbp/reviews` | 200 | Reviews |
| `GET /(protected)/gbp/insights` | 200 | Insights |

---

## Verificación

Spec satisfecha cuando ✓:

- [ ] Migration `0003_gbp.sql` aplicada.
- [ ] Tests `src/lib/text.test.ts` verdes.
- [ ] Smoke checklist GBP pasa: crear profile, posts, reviews, response, insights con datos populados.
- [ ] RLS smoke: 2 users distintos no se ven mutuamente.
- [ ] Lighthouse a11y ≥ 0.90 en `/gbp/*` ambos temas.
- [ ] `HoursEditor` accesible vía teclado (Tab entre días, Enter/Space en checkbox cerrado).

---

## Histórico de cambios

| Versión | Fecha       | Cambio | Source |
|---------|-------------|--------|--------|
| v0.5.0  | (al archivar)  | ADDED Capability GBP Simulator (3 tablas + 5 rutas + helper text.ts). MODIFIED Public surface. | [`changes/archive/gbp-simulator/`](../../../changes/archive/gbp-simulator/) |
