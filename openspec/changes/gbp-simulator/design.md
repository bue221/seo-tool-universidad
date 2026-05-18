# Design: gbp-simulator

**Scope:** Cómo simulamos Google Business Profile con Supabase, calculamos impacto de keywords locales, y cómo se ven las 5 páginas.

---

## 1. Decisiones técnicas

| Capa | Elección | Alternativas descartadas | Por qué |
|------|----------|--------------------------|---------|
| CRUD | **Server actions** | Route handlers `/api/gbp/*` | Consistencia con `audit-runner` y `auth-foundation`. Menos boilerplate. |
| Forms | **`react-hook-form + zodResolver`** (ui-foundation) | Server-only forms con FormData manual | Type-safety + UX optimista + integración con `Form` Shadcn. |
| HoursEditor | **Custom Client Component** | Librería externa (TimePicker, etc.) | mvp simple: 7 días con `<input type="time">` nativos. Cero deps nuevas. |
| Tokenización TS | **Helper local `src/lib/text.ts`** | Reusar lib Go vía API | Cliente puede tokenizar localmente sin red. Implementación independiente. |
| Stop-words | **Array embebido `src/lib/text-data.ts`** | JSON externo + lazy load | mvp: ~300 términos no justifican lazy. Embebido es 0 IO. |

## 2. Estructura de carpetas

```
dashboard-web/
├── supabase/
│   └── migrations/
│       └── 0003_gbp.sql
└── src/
    ├── app/
    │   └── [locale]/
    │       └── (protected)/
    │           └── gbp/
    │               ├── layout.tsx                # Tabs nav GBP (profile/posts/reviews/insights)
    │               ├── page.tsx                  # Landing (redirect o CTA)
    │               ├── profile/page.tsx          # Form CRUD profile
    │               ├── posts/page.tsx            # Listado + crear post
    │               ├── reviews/page.tsx          # Listado + crear review + response
    │               ├── insights/page.tsx         # Métricas calculadas
    │               ├── _actions/
    │               │   ├── upsert-profile.ts
    │               │   ├── create-post.ts
    │               │   ├── delete-post.ts
    │               │   ├── create-review.ts
    │               │   └── add-review-response.ts
    │               ├── _components/
    │               │   ├── BusinessProfileForm.tsx
    │               │   ├── HoursEditor.tsx
    │               │   ├── PostsList.tsx
    │               │   ├── PostForm.tsx
    │               │   ├── PostCard.tsx
    │               │   ├── ReviewsList.tsx
    │               │   ├── ReviewForm.tsx
    │               │   ├── ReviewCard.tsx
    │               │   ├── ResponseForm.tsx
    │               │   ├── KeywordImpactCard.tsx
    │               │   └── ComparisonCard.tsx
    │               └── _lib/
    │                   ├── queries.ts            # Server-side data fetchers
    │                   └── types.ts              # BusinessProfile, BusinessPost, BusinessReview
    └── lib/
        ├── text.ts                                # tokenize, removeStopWords, keywordDensity
        └── text-data.ts                           # arrays stopwordsES/EN combined
```

## 3. Esquema SQL

```sql
-- supabase/migrations/0003_gbp.sql

-- 1 profile per user
create table public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  category text not null,
  description text,
  address text,
  phone text,
  website_url text,
  hours jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.business_profiles(id) on delete cascade,
  title text not null,
  body text not null,
  cta_label text,
  cta_url text,
  published_at timestamptz not null default now()
);

create table public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.business_profiles(id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  response text,
  reviewed_at timestamptz not null default now(),
  responded_at timestamptz
);

-- RLS jerárquica: user_id directo en profiles; via profile_id en posts/reviews.
alter table public.business_profiles enable row level security;
alter table public.business_posts enable row level security;
alter table public.business_reviews enable row level security;

create policy "own profile rw"
  on public.business_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own posts rw"
  on public.business_posts for all
  using (
    profile_id in (select id from public.business_profiles where user_id = auth.uid())
  )
  with check (
    profile_id in (select id from public.business_profiles where user_id = auth.uid())
  );

create policy "own reviews rw"
  on public.business_reviews for all
  using (
    profile_id in (select id from public.business_profiles where user_id = auth.uid())
  )
  with check (
    profile_id in (select id from public.business_profiles where user_id = auth.uid())
  );

-- updated_at automático en profiles
create trigger business_profiles_touch_updated_at
  before update on public.business_profiles
  for each row execute function public.touch_updated_at();

-- Indexes para listings
create index business_posts_profile_published_idx
  on public.business_posts (profile_id, published_at desc);

create index business_reviews_profile_reviewed_idx
  on public.business_reviews (profile_id, reviewed_at desc);
```

## 4. Wireframes

### `/gbp` (landing)

```
┌──────────────────────────────────────────┐
│ header (auth-foundation)                 │
├──────────────────────────────────────────┤
│  Si no hay profile:                       │
│  ┌─────────────────────────────┐         │
│  │  📍                          │         │
│  │  Aún no tienes un perfil    │         │
│  │  de negocio simulado.       │         │
│  │  [ Crear perfil ]           │         │
│  └─────────────────────────────┘         │
│                                          │
│  Si hay profile:                          │
│    → redirect /gbp/profile               │
└──────────────────────────────────────────┘
```

### Layout con Tabs nav (compartido por profile, posts, reviews, insights)

```
┌──────────────────────────────────────────┐
│ header                                   │
├──────────────────────────────────────────┤
│ <Tabs>                                   │
│   [ Perfil ] [ Posts ] [ Reseñas ]       │
│   [ Insights ]                           │
│ </Tabs>                                  │
│                                          │
│ (contenido de la sub-página)             │
└──────────────────────────────────────────┘
```

### `/gbp/profile`

```
┌──────────────────────────────────────────┐
│ Tab nav (Perfil activo)                  │
├──────────────────────────────────────────┤
│ <Card>                                   │
│  Nombre del negocio:  [____________]     │
│  Categoría:           [____________]     │
│  Descripción:         [____________]     │
│                       [____________]     │
│  Dirección:           [____________]     │
│  Teléfono:            [____________]     │
│  Sitio web:           [____________]     │
│                                          │
│  Horarios:                                │
│  L  [09:00] - [18:00]   ☐ Cerrado         │
│  M  [09:00] - [18:00]   ☐ Cerrado         │
│  ... (7 días)                            │
│                                          │
│        [ Cancelar ]  [ Guardar ]         │
│ </Card>                                  │
└──────────────────────────────────────────┘
```

### `/gbp/posts`

```
┌──────────────────────────────────────────┐
│ Tab nav (Posts activo)                   │
├──────────────────────────────────────────┤
│ <Card> "Crear nueva publicación"          │
│  Título:    [____________]               │
│  Cuerpo:    [____________]               │
│             [____________]               │
│  CTA label: [Optional]                   │
│  CTA URL:   [Optional]                   │
│             [ Publicar ]                 │
│ </Card>                                  │
│                                          │
│ <Card>  Publicaciones                     │
│   PostCard 1                             │
│   PostCard 2                             │
│   PostCard 3                             │
│   (empty state si vacío)                 │
│ </Card>                                  │
└──────────────────────────────────────────┘
```

### `/gbp/reviews`

```
┌──────────────────────────────────────────┐
│ Tab nav (Reseñas activo)                 │
├──────────────────────────────────────────┤
│ <Card> "Simular reseña"                   │
│  Autor:      [____________]              │
│  Rating:     [★ ★ ★ ★ ★] (1-5)           │
│  Comentario: [____________]              │
│              [ Guardar ]                  │
│ </Card>                                  │
│                                          │
│ <Card>  Reseñas                          │
│   ReviewCard 1                           │
│     ↳ "Tu respuesta:" [____] [Responder] │
│   ReviewCard 2 (con respuesta)           │
│   ...                                    │
│ </Card>                                  │
└──────────────────────────────────────────┘
```

### `/gbp/insights`

```
┌──────────────────────────────────────────┐
│ Tab nav (Insights activo)                │
├──────────────────────────────────────────┤
│ <KeywordImpactCard>                      │
│   Top 10 keywords en tus posts:           │
│   1. servicio  - 8.2%                    │
│   2. calidad   - 6.1%                    │
│   3. ...                                 │
│ </KeywordImpactCard>                     │
│                                          │
│ <ComparisonCard>                         │
│   Comparativa con tu sitio web:           │
│   ✓ Coincidencias: servicio, calidad     │
│   ✗ Gaps (faltan en tu sitio):           │
│     - profesional, garantía              │
│   ⚠ Solo en sitio (no en posts):          │
│     - envío, tienda                      │
│   (Última auditoría: 18 may 2026)        │
│   [ Ejecutar nueva auditoría ]            │
│ </ComparisonCard>                        │
└──────────────────────────────────────────┘
```

## 5. Mapping GBP real → simulación

Para que el profesor vea fidelidad:

| Campo GBP real (API) | Campo nuestro | Notas |
|----------------------|----------------|-------|
| `Location.name` (resource id) | `id` (uuid) | mvp usa UUID generado vs `accounts/123/locations/456`. |
| `Location.title` | `business_name` | Same semantically. |
| `Location.primaryCategory` | `category` | Mvp: free text. Real API tiene enum. |
| `Location.profile.description` | `description` | Same. |
| `Location.storefrontAddress.addressLines[]` | `address` | Mvp: solo texto plano (real es array). |
| `Location.phoneNumbers.primaryPhone` | `phone` | Same. |
| `Location.websiteUri` | `website_url` | Same. |
| `Location.regularHours.periods[]` | `hours` jsonb | Mvp simplificado. |
| `LocalPost.summary` | `business_posts.body` | Same. |
| `LocalPost.callToAction` | `cta_label` + `cta_url` | Same. |
| `Review.reviewer.displayName` | `business_reviews.author_name` | Same. |
| `Review.starRating` | `rating` | Same (1-5). |
| `Review.comment` | `body` | Same. |
| `Review.reviewReply.comment` | `response` | Same. |

## 6. Helper `src/lib/text.ts`

```ts
// src/lib/text.ts
import { STOPWORDS_COMBINED } from './text-data';

const stopwordsSet = new Set(STOPWORDS_COMBINED);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')   // Unicode-aware: solo letters + digits + spaces
    .split(/\s+/)
    .filter(Boolean);
}

export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((t) => !stopwordsSet.has(t) && t.length > 2);
}

export type KeywordEntry = { term: string; density: number };

export function keywordDensity(tokens: string[], topN = 10): KeywordEntry[] {
  if (tokens.length === 0) return [];
  const counts = new Map<string, number>();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const total = tokens.length;
  return Array.from(counts.entries())
    .map(([term, count]) => ({ term, density: count / total }))
    .sort((a, b) => b.density - a.density)
    .slice(0, topN);
}
```

Tradeoff: tokenización TS divergente del Go scraper (distintos contextos: posts internos vs HTML público). Aceptado.

## 7. Cálculo de impacto en `/insights`

```ts
// Server Component
async function loadInsightsData(userId: string) {
  const supabase = await createClient();
  const [profileRes, postsRes, snapshotRes] = await Promise.all([
    supabase.from('business_profiles').select('description, website_url').eq('user_id', userId).single(),
    supabase.from('business_posts').select('body').eq('profile_id', profile.id),
    supabase.from('seo_snapshots').select('result').eq('user_id', userId)
      .eq('url', profile.website_url).order('fetched_at', { ascending: false }).limit(1),
  ]);

  const allText = [profileRes.data?.description, ...postsRes.data?.map(p => p.body)].filter(Boolean).join(' ');
  const tokens = removeStopWords(tokenize(allText));
  const userKeywords = keywordDensity(tokens, 10);

  const scraperKeywords = snapshotRes.data?.[0]?.result?.keywords?.top ?? [];
  // Compute coincidences, gaps...
  return { userKeywords, scraperKeywords };
}
```

Comparativa se calcula en el Server Component (snapshot inicial) — no necesita interactividad.

## 8. HoursEditor

State shape interno:

```ts
type Hours = {
  monday?:    { open: string; close: string } | null;
  tuesday?:   { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?:  { open: string; close: string } | null;
  friday?:    { open: string; close: string } | null;
  saturday?:  { open: string; close: string } | null;
  sunday?:    { open: string; close: string } | null;
};
```

UI: grid 7 filas. Cada fila: `<Label>{día}</Label>` + `<Input type="time">` × 2 + `<Checkbox>Cerrado</Checkbox>` (cuando check, los inputs se hide y el día se setea a `null` en el state).

Output: `hours` (jsonb) stringified al submit del form padre.

## 9. Tradeoffs aceptados

- **1 profile/user en mvp**: la realidad GBP soporta `multiple locations` por owner. Aceptable para demo académica. Si en el futuro se requiere, agregar `business_locations` con FK al profile y migrar.
- **Reviews simuladas (input manual)**: no es realista pero es la única opción sin API real. El profesor lo va a entender porque es el punto de la simulación.
- **No paginate por ahora**: 20 posts × 5 reviews por profile es manejable. Si crece, paginar con LIMIT/OFFSET.
- **Tokenización divergente JS vs Go**: contextos distintos, fórmulas equivalentes pero implementaciones independientes.

## 10. Plan de rollout

1. Aplicar migración SQL `0003_gbp.sql`.
2. Implementar páginas + actions en PR único.
3. Smoke: crear profile, agregar 3 posts, agregar 2 reviews con respuestas, ir a insights.
4. RLS smoke: 2 usuarios distintos, cada uno solo ve sus datos.
5. Merge → módulo disponible.
