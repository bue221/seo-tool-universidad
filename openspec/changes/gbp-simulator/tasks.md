# Tasks: gbp-simulator

> Marcar `[x]` al completar. Bloqueado por `auth-foundation`.

---

## 0. Pre-requisitos

- [ ] `auth-foundation` aplicado (`getCurrentUser()`, rutas `(protected)/`).
- [ ] (Opcional) `audit-runner` aplicado para tener tabla `seo_snapshots` que alimente la comparativa de insights.

## 1. Esquema Supabase

- [ ] `dashboard-web/supabase/migrations/0003_gbp.sql`:
  - 3 tablas: `business_profiles`, `business_posts`, `business_reviews`.
  - FK + ON DELETE CASCADE.
  - RLS jerárquica: profiles via `user_id`; posts/reviews via `profile_id IN (select ... where user_id = auth.uid())`.
  - Trigger `touch_updated_at` en `business_profiles`.
  - Indexes en `(profile_id, published_at desc)` y `(profile_id, reviewed_at desc)`.
- [ ] Aplicar migración.

## 2. Helper `src/lib/text.ts`

- [ ] `src/lib/text-data.ts` con `STOPWORDS_COMBINED: string[]` (~300 términos ES+EN).
- [ ] `src/lib/text.ts` con `tokenize`, `removeStopWords`, `keywordDensity`.
- [ ] Tests `src/lib/text.test.ts`:
  - tokenize Unicode-aware (incluye eñes, tildes).
  - removeStopWords filtra y elimina tokens ≤2 chars.
  - keywordDensity ordena correctamente.
  - empty input → empty output.

## 3. Tipos compartidos

- [ ] `src/app/[locale]/(protected)/gbp/_lib/types.ts`:
  - `BusinessProfile`, `BusinessPost`, `BusinessReview` mapeando columnas de DB.
  - `Hours` con shape descrito en design.

## 4. Server actions

- [ ] `_actions/upsert-profile.ts`:
  - Schema zod con campos del profile + `hours: z.record(z.enum(days), z.object({open, close}).nullable().optional())`.
  - UPSERT vía `supabase.from('business_profiles').upsert({...})`.
- [ ] `_actions/create-post.ts` — INSERT a `business_posts` (verificar profile del user).
- [ ] `_actions/delete-post.ts` — DELETE por `id` (RLS bloquea ajenos).
- [ ] `_actions/create-review.ts` — INSERT a `business_reviews`.
- [ ] `_actions/add-review-response.ts` — UPDATE `response` + `responded_at`.
- [ ] Todas con shape `{ ok, error?, data? }` + revalidatePath de su sub-ruta.

## 5. Queries server-side

- [ ] `_lib/queries.ts`:
  - `getProfile(userId)` — single row o null.
  - `listPosts(profileId, limit = 20)`.
  - `listReviews(profileId, limit = 20)`.
  - `getLatestSnapshot(userId, websiteUrl)` — para insights.

## 6. Páginas y layout

### Layout
- [ ] `gbp/layout.tsx` — Tabs nav con 4 items (profile/posts/reviews/insights). Server Component.

### `/gbp` (landing)
- [ ] `gbp/page.tsx`:
  - `getCurrentUser()`.
  - `getProfile(user.id)`.
  - Si null → render CTA con `Link` a `/gbp/profile`.
  - Si presente → `redirect('/gbp/profile')`.

### `/gbp/profile`
- [ ] `gbp/profile/page.tsx` — Server fetch del profile (puede ser null si está creando) + render `<BusinessProfileForm>`.
- [ ] `_components/BusinessProfileForm.tsx` — Client Component:
  - `useForm({ defaultValues: profile ?? {} })`.
  - Campos: `business_name`, `category`, `description`, `address`, `phone`, `website_url` + `<HoursEditor>`.
  - Submit llama `upsertProfile` action.
  - Toast feedback.
- [ ] `_components/HoursEditor.tsx` — Client Component:
  - 7 filas (un día cada una).
  - Cada fila: `<Label>` + 2 `<Input type="time">` + `<Checkbox>Cerrado</Checkbox>`.
  - State manejado con `useState<Hours>`. Output sincronizado al form padre via `Controller` de react-hook-form.

### `/gbp/posts`
- [ ] `gbp/posts/page.tsx` — fetch posts del user + render `<PostForm>` + `<PostsList>`.
- [ ] `_components/PostForm.tsx` — Client. Fields: title, body, cta_label, cta_url. Submit + toast.
- [ ] `_components/PostsList.tsx` — Server Component mapeando posts a `<PostCard>`.
- [ ] `_components/PostCard.tsx` — Card con title + body truncado + cta link + button delete.

### `/gbp/reviews`
- [ ] `gbp/reviews/page.tsx` — fetch reviews + render `<ReviewForm>` + `<ReviewsList>`.
- [ ] `_components/ReviewForm.tsx` — Client. Fields: author_name, rating (1-5 stars), body. Submit + toast.
- [ ] `_components/ReviewsList.tsx` — Server mapping a `<ReviewCard>`.
- [ ] `_components/ReviewCard.tsx`:
  - Header: author + rating stars + fecha.
  - Body de la review.
  - Si `response` ya existe, mostrarla con badge "Tu respuesta".
  - Si no, mostrar inline `<ResponseForm>` con campo `response` + submit.

### `/gbp/insights`
- [ ] `gbp/insights/page.tsx`:
  - Server Component.
  - Carga profile, posts, latest snapshot en paralelo.
  - Calcula `userKeywords` con helper.
  - Calcula `coincidences`, `gaps`, `onlyInSite` comparando contra `scraperKeywords` (si existe).
  - Render `<KeywordImpactCard userKeywords={...} />` + `<ComparisonCard {...} />`.

## 7. i18n

- [ ] `messages/{es,en}.json` namespaces:
  - `GBP.Common` (terms generales).
  - `GBP.Landing`.
  - `GBP.Profile` (form labels, errors, save).
  - `GBP.Posts`.
  - `GBP.Reviews` (incluye rating labels para a11y).
  - `GBP.Insights` (keywords title, coincidence, gaps, runAuditCTA).
  - `GBP.HoursEditor` (días + "Cerrado").

## 8. Tests

- [ ] `src/lib/text.test.ts` — tokenize, stopwords, density.
- [ ] Test unit server actions: validación zod schemas.
- [ ] Smoke e2e manual:
  - Crear profile → ver en DB.
  - Editar profile → ver `updated_at` cambiado.
  - Crear 3 posts → render correcto + paginate (si hay >20).
  - Crear review + responder.
  - `/insights` calcula keywords sobre 5+ posts.
  - 2 users distintos: cada uno solo ve sus datos (RLS).

## 9. Documentación

- [ ] `dashboard-web/README.md`: cookbook nueva receta "agregar un módulo CRUD con Supabase + RLS jerárquica".
- [ ] `dashboard-web/agents.md`: agregar capacidad "GBP Simulator" + mapping a API real en design.
- [ ] `dashboard-web/SMOKE.md`: sección smoke GBP.

## 10. Cierre

- [ ] PR título: `feat(web): GBP simulator (profile + posts + reviews + insights) [gbp-simulator]`.
- [ ] Validar specs: review manual del delta.
- [ ] Archive offline:
  - Promover delta a `openspec/specs/dashboard-web/spec.md` (v0.5.0).
  - Mover a `openspec/changes/archive/gbp-simulator/`.
- [ ] Actualizar `openspec/README.md` y `AGENTS.md` raíz.
