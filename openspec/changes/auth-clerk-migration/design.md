# Design: auth-clerk-migration

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│    ClerkProvider (cliente)                                   │
│      ├─ <SignIn /> ─→ /login                                 │
│      ├─ <SignUp /> ─→ /signup                                │
│      └─ <UserButton/SignOutButton />                         │
└────────────────────────┬─────────────────────────────────────┘
                         │  session token (JWT con role=authenticated)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Next.js middleware                                          │
│    clerkMiddleware()                                         │
│      ├─ adjunta auth() al request                            │
│      └─ luego corre next-intl                                │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Server components / actions                                 │
│    auth() → { userId, getToken }                             │
│    createSupabaseServer(getToken) → SupabaseClient con       │
│       Authorization: Bearer <clerk JWT>                      │
│    Supabase RLS lee `auth.jwt() ->> 'sub'` → user_id Clerk   │
└──────────────────────────────────────────────────────────────┘
```

## Key decisions

### 1. Drop `@supabase/ssr` for auth, keep for data access

`@supabase/ssr` existe para sincronizar cookies de Supabase Auth con SSR. Con Clerk **ya no hay cookies de Supabase**, el JWT viaja en el header `Authorization`. Pero seguimos usando `createServerClient` de `@supabase/ssr` porque acepta `accessToken` callback y maneja correctamente Edge runtime. Alternativa descartada: usar `@supabase/supabase-js` plano — funciona pero pierde optimizaciones de Next.

Decisión: pasar `accessToken: async () => (await auth()).getToken()` al `createServerClient`. Las cookies callbacks se vuelven no-op (no hay cookies Supabase que setear).

### 2. Middleware composition order

`clerkMiddleware` **antes** que `next-intl`. Razones:

- `clerkMiddleware` agrega `auth()` al request scope; `next-intl` solo reescribe URLs.
- Si next-intl redirige (ej. `/login` → `/es/login`), queremos que Clerk vea la URL ya localizada para matchear su matcher.

Pattern:

```ts
export default clerkMiddleware((auth, req) => {
  return intlMiddleware(req);
});
```

Public routes (no requieren auth): `/{locale}/login(.*)`, `/{locale}/signup(.*)`, raíz `/`, `/api/*`.

### 3. Locale-aware Clerk routes

Clerk usa `signInUrl` / `signUpUrl` para redirects. Como nuestras rutas son `[locale]/login`, configuramos vía env:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/es/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/es/signup
```

Limitación aceptada: el default es `es`. Si el user navega en `/en/...` y queda sin auth, Clerk redirige a `/es/login` — luego next-intl lo corrige al locale activo. Es aceptable para el alcance académico; se puede refinar con un wrapper que lea el locale del path.

### 4. `getCurrentUser()` semantics

Antes:
```ts
supabase.auth.getUser() → { id, email }
```

Después:
```ts
const { userId } = await auth();
const user = await currentUser(); // Clerk
const supabase = await createClient();
const { data: profile } = await supabase.from('profiles').eq('user_id', userId).maybeSingle();
return { id: userId, email: user.emailAddresses[0].emailAddress, displayName: profile?.display_name };
```

Tabla `profiles` ahora usa `user_id` = **Clerk user id** (string `user_xxx`), no UUID Supabase. Migración manual del schema queda fuera de scope porque no hay data productiva — solo nota en el spec.

### 5. Sign-out

`<SignOutButton>` de Clerk dentro de `UserMenu`. La server action `sign-out.ts` se reescribe para llamar `(await auth()).signOut()` solo si algún call-site server-side la necesita; si no, se elimina.

## Risks

| Risk | Mitigación |
|------|-----------|
| RLS policies fallan porque `auth.uid()` ya no resuelve | Documentar en spec: las policies deben usar `auth.jwt() ->> 'sub'` o el helper que Supabase provee para third-party. Validar en verify. |
| `clerkMiddleware` + `next-intl` rompen redirects | Test manual de `/` → `/es` y `/en/dashboard` sin auth → `/es/login`. |
| Edge runtime no soporta Clerk en algún punto | Clerk soporta Edge; si falla, mover middleware a Node runtime. |
| Tests preexistentes (`auth.test.ts`, `schemas.test.ts`) refieren a código eliminado | Borrar los tests junto con el código. |

## Migration notes (DB)

`profiles.user_id` debe cambiar de tipo `uuid` a `text` para aceptar IDs Clerk (`user_xxx`). Se documenta en el spec; la migración SQL se aplicará en un change separado si hay data. Para dev académico: truncate + recreate.
