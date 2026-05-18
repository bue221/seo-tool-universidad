# Proposal: gbp-simulator

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-18
**Depends on:**
- [`auth-foundation`](../auth-foundation/) (proposed) — usuario autenticado.
- [`ui-foundation`](../archive/ui-foundation/) — Form, Card, Tabs, Badge.
- [`audit-runner`](../audit-runner/) (proposed) — opcionalmente para comparativa con `seo_snapshots`.

---

## ¿Por qué?

El alcance académico del proyecto incluye **gestión de Google Business Profile** (antes "My Business"). La API real de Google Business Profile requiere verificación de un negocio físico real, lo cual:

- No podemos hacer en contexto académico (no tenemos un negocio físico verificable).
- Tiene cuotas y procesos de aprobación que harían inviable la demo.

La solución elegante: **simular estructuralmente** la API. Replicar el shape de los datos (business profile, posts, reviews) y las operaciones (CRUD, métricas) usando Supabase como backend. El usuario (profesor) puede ver que la **arquitectura es fiel** sin requerir credenciales reales de Google.

Además permite:
- Calcular "impacto de keywords locales" — métrica que combina las palabras clave usadas en posts y descripciones del business con las keywords detectadas en la URL del sitio web por el scraper.
- Demostrar dominio de Supabase con multi-tabla + RLS jerárquica.
- Setear las bases para una integración con la API real en el futuro (si algún día se obtiene verificación).

## ¿Qué?

### Alcance (in-scope)

1. **Esquema Supabase**: 3 tablas con RLS por user_id (jerárquica via business_profiles):
   - `business_profiles` — un perfil por usuario (1:1).
   - `business_posts` — N posts por perfil.
   - `business_reviews` — N reviews por perfil.
   - Migración `0003_gbp.sql`.

2. **5 páginas** dentro de `/[locale]/(protected)/gbp/`:
   - `/gbp` — landing: si no hay profile → CTA "Crear perfil"; si hay → redirect a `/gbp/profile`.
   - `/gbp/profile` — form CRUD del business profile.
   - `/gbp/posts` — listado + form crear post + delete.
   - `/gbp/reviews` — listado + form simular review + form de respuesta.
   - `/gbp/insights` — métricas calculadas (impacto de keywords locales + comparativa con seo_snapshots si hay).

3. **Server actions CRUD** en `_actions/`:
   - `createOrUpdateProfile(formData)`.
   - `createPost(formData)`.
   - `deletePost(postId)`.
   - `createReview(formData)` — simulación: el usuario captura una review como si la hubiera recibido.
   - `addReviewResponse(reviewId, formData)`.

4. **Componentes**:
   - `BusinessProfileForm.tsx` — Form con todos los campos.
   - `HoursEditor.tsx` — custom: grid 7 días × (open, close) inputs de hora. State manejado via `useState`, output a campo `hours` (jsonb).
   - `PostsList.tsx`, `PostForm.tsx`, `PostCard.tsx`.
   - `ReviewsList.tsx`, `ReviewForm.tsx`, `ReviewCard.tsx` (incluye `ResponseForm` inline).
   - `KeywordImpactCard.tsx` — para insights.

5. **Cálculo de "impacto de keywords locales"** en `/insights`:
   - Tokenizar: todos los `business_posts.body` + `business_profiles.description` del usuario.
   - Limpiar y filtrar stop-words ES+EN (reusar `src/lib/text.ts` — helper compartido con futuras features).
   - Calcular top 10 keywords con densidad.
   - **Comparativa opcional**: si hay un `seo_snapshots` reciente para `business_profiles.website_url`, comparar las keywords detectadas por el scraper vs las usadas en posts. Mostrar coincidencias y gaps.

6. **Helper `src/lib/text.ts`** (nuevo):
   - `tokenize(text: string): string[]` — Unicode-aware, lowercase, sin punctuation.
   - `removeStopWords(tokens: string[]): string[]` — usa diccionario embebido (ES+EN).
   - `keywordDensity(tokens: string[], topN: number = 10): { term: string; density: number }[]`.
   - Stop-words: array embebido en `src/lib/text-data.ts` (~300 términos combinados ES+EN). Compartido conceptualmente con scraper-api pero implementación independiente.

7. **i18n**: namespaces nuevos:
   - `GBP.Common` (appName, business, post, review, ...).
   - `GBP.Landing` (createCTA, manage).
   - `GBP.Profile` (form labels, save, errors).
   - `GBP.Posts` (form, list, empty).
   - `GBP.Reviews` (form, list, response form).
   - `GBP.Insights` (keywords, coincidence, gaps).

8. **Wireframe del módulo** documentado en design.md.

### No-objetivos (out-of-scope explícito)

- **No** sincronización con Google Business Profile real.
- **No** multi-business per user. **1 user = 1 business profile** en mvp. Cambio futuro si necesita.
- **No** upload de fotos / videos del negocio.
- **No** notificaciones de "nueva reseña" — todas son inputadas manualmente por el usuario.
- **No** geocoding / mapa del address — solo texto.
- **No** métricas avanzadas (search visibility, click-through rates).
- **No** export a CSV/PDF de reviews o posts.
- **No** reply templates / quick responses.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Profesor pregunta si funciona con un negocio real → no | En `agents.md` queda documentado que es simulación. La estructura es fiel y migrable. |
| Tokenización en TS no matchea exactamente la del scraper-api (Go) | Aceptable — son contextos distintos (posts internos vs HTML externo). Documentar diferencia. |
| Profile con horarios complejos (días sin hours, 24h, split shifts) | mvp: cada día tiene un solo bloque de `{ open, close }` o vacío. Sin split shifts. |
| Comparativa con `seo_snapshots` falla si no hay snapshots | Mostrar mensaje "Ejecuta una auditoría primero" + link a `/audit`. |
| Usuario crea muchos posts/reviews → render lento | Paginar a 20 por página (mvp). Suficiente para demo. |
| Sin foreign key cleanup entre business_posts y business_profiles | FK con `ON DELETE CASCADE` cubre el caso de eliminar el profile. |
| 2 users distintos comparten un solo Supabase project — RLS mal definida filtraría datos | RLS jerárquica + tests smoke. |

## Métricas de éxito

- Crear business profile, agregar 3 posts, agregar 2 reviews con respuestas → todo persistido en < 2 minutos de UX.
- `/insights` calcula keywords sobre 5+ posts en < 500ms client-side.
- Comparativa con seo_snapshots muestra coincidencias y gaps claros.
- RLS smoke: 2 users no ven datos del otro (mismo test pattern que auth-foundation).
- Lighthouse a11y ≥ 0.90 en todas las páginas /gbp/* en ambos temas.
- Forms con validación zod completa (no allow empty business_name, rating 1-5, etc.).

## Referencias

- Spec activa: [`openspec/specs/dashboard-web/spec.md`](../../specs/dashboard-web/spec.md).
- Docs Google Business Profile API: https://developers.google.com/my-business (referencia para shape fiel).
