# Delta: dashboard-web @ auth-foundation

> **Convención OpenSpec:** este archivo describe cambios incrementales contra
> [`openspec/specs/dashboard-web/spec.md`](../../../../specs/dashboard-web/spec.md)
> (v0.2.0).

---

## ADDED — Capability: Authentication

### Provider

- **Supabase Auth** con `@supabase/ssr ^0.5.0`.
- Método inicial: **email + password** únicamente (mvp).
- Email confirmation **ON** por default. Configurable en Supabase dashboard.
- Cookies HTTP-only manejadas automáticamente por `@supabase/ssr`.

### Clientes

- `src/lib/supabase/server.ts` — `createClient()` async con `cookies()` de Next 15. Usado en Server Components, Server Actions, Route Handlers.
- `src/lib/supabase/browser.ts` — `createClient()` (no async) con `createBrowserClient`. Usado solo en Client Components con `'use client'` directive.
- `src/lib/supabase/middleware.ts` — `updateSession(request)`. Refresca cookies y llama `supabase.auth.getUser()`. **Línea crítica que no se debe remover.**

### Helper `getCurrentUser()`

- Server-only, en `src/lib/auth.ts`.
- Devuelve `{ id, email, displayName } | null`.
- Hace fetch del profile asociado al user; si no existe, retorna `displayName: null` (defensiva — el trigger SQL siempre crea profile, pero la app no asume eso).

### Esquema

Tabla `public.profiles`:

| Columna | Tipo | Constraint |
|---------|------|-----------|
| `id` | `uuid` | PK, FK a `auth.users(id)` ON DELETE CASCADE |
| `display_name` | `text` | nullable |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now(), trigger touch |

Triggers:

- `on_auth_user_created` — insert en `auth.users` → insert en `public.profiles` con `display_name` desde `raw_user_meta_data->>'display_name'`.
- `profiles_touch_updated_at` — BEFORE UPDATE → set `updated_at = now()`.

### RLS

| Policy | Tabla | Acción | Condición |
|--------|-------|--------|-----------|
| `users read own profile` | `profiles` | SELECT | `auth.uid() = id` |
| `users update own profile` | `profiles` | UPDATE | `auth.uid() = id` (USING + WITH CHECK) |

No hay INSERT policy (el trigger lo hace via `security definer`). No hay DELETE policy (el cascade del FK lo maneja).

### Server actions

Todas en `src/app/[locale]/(auth)/_actions/`. Shape de retorno:

```ts
type Result<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: { code: string; message: string } };
```

| Action | Input | Side effects |
|--------|-------|--------------|
| `signIn(formData)` | email, password | Set cookies + `redirect('/dashboard')` |
| `signUp(formData)` | email, password, displayName | Crear user + enviar email confirmación |
| `signOut()` | — | Clear cookies + `redirect('/login')` |
| `requestPasswordReset(formData)` | email | Enviar email con reset link |
| `updatePassword(formData)` | newPassword (lee token de URL) | Cambiar password + `redirect('/login')` |

### Redirects localizados

- Todos los `redirect()` desde server actions usan `redirect` de `@/i18n/navigation`, no de `next/navigation`.
- Esto preserva el locale activo (`/en/login` no se rompe en `/login`).

### Layout `(protected)/`

- Route group `app/[locale]/(protected)/`.
- `layout.tsx` llama `getCurrentUser()` server-side.
- Si null → `redirect({ href: '/login', locale })`.
- Renderiza header con LocaleSwitcher + ThemeToggle + UserMenu (dropdown email + signOut).

### Códigos de error y traducciones

| Code | Translation key |
|------|-----------------|
| `VALIDATION` | `Auth.Common.errors.validation` |
| `AUTH_FAILED` | `Auth.Login.errors.failed` |
| `EMAIL_TAKEN` | `Auth.Signup.errors.emailTaken` |
| `WEAK_PASSWORD` | `Auth.Signup.errors.weakPassword` |
| `RESET_LINK_INVALID` | `Auth.ResetPassword.errors.linkInvalid` |
| `UNKNOWN` | `Auth.Common.errors.unknown` |

El cliente traduce con `t(\`errors.\${code}\`)` y muestra via `toast.error(...)`.

### Invariantes nuevas

11. **Rutas autenticadas SOLO dentro de `app/[locale]/(protected)/`.** No mezclar rutas auth-requiring fuera de ese segment.
12. **Server actions retornan `{ ok, error?, data? }`** o hacen `redirect()` (que lanza). Nunca devolver datos crudos sin shape.
13. **`serverEnv` jamás se importa en Client Components.** Solo desde código con `'use server'` o `app/api/`. (Eslint rule futura para enforcing.)
14. **Cookies de Supabase refrescadas en middleware** (línea `await supabase.auth.getUser()`). Si esa línea se remueve, las sesiones expiran rápido.
15. **Email + password únicos por usuario** — unicidad enforced por `auth.users.email` (Supabase default).

---

## MODIFIED — Capability: Environment configuration

### Variables agregadas

Schema `publicEnvSchema` (en `src/lib/env.ts`) extendido con:

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL absoluta | — | Origin del Supabase project (project_ref.supabase.co). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string min 20 chars | — | Anon key — safe to expose to client. |

Schema **nuevo** `serverEnvSchema` (server-only):

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | string min 20 chars | — | Service role — bypassea RLS. **Jamás exponer al cliente.** |

`src/lib/env.ts` exporta `env` (público) y `serverEnv` (server-only). Importar `serverEnv` desde un Client Component falla en runtime (undefined).

---

## MODIFIED — Capability: Public surface

### Endpoints agregados

| Endpoint | Status | Contenido |
|----------|--------|-----------|
| `GET /login`, `/en/login` | 200 | Form login (`Auth.Login`) |
| `GET /signup`, `/en/signup` | 200 | Form signup (`Auth.Signup`) |
| `GET /forgot-password`, `/en/forgot-password` | 200 | Form solicitar reset (`Auth.ForgotPassword`) |
| `GET /reset-password?token=...`, `/en/reset-password?...` | 200 | Form nueva password (`Auth.ResetPassword`) |
| `GET /(protected)/dashboard`, `/en/(protected)/dashboard` | 200 (con sesión) / 307 redirect a `/login` (sin sesión) | Welcome page |

Nota: el segmento `(protected)` no aparece en URLs públicas — Next route groups son solo organizativos.

---

## Verificación

Spec satisfecha cuando ✓:

- [ ] `pnpm test` pasa tests de `auth.test.ts` + schemas zod.
- [ ] `pnpm build` compila sin error (incluye validación zod del env extendido).
- [ ] Migration `0001_profiles.sql` aplicada en el Supabase project (verificado en dashboard).
- [ ] Smoke checklist `SMOKE.md` sección auth pasa: signup→confirm→login→dashboard→logout.
- [ ] RLS smoke: 2 usuarios distintos no leen profile del otro.
- [ ] `view-source:/login` muestra `<html lang="es">` y metadata correcta.
- [ ] Lighthouse a11y ≥ 0.90 sigue cumpliendo en formularios de auth.

---

## Histórico de cambios

| Versión | Fecha       | Cambio | Source |
|---------|-------------|--------|--------|
| v0.3.0  | (al archivar)  | ADDED Capability Authentication. MODIFIED Environment (3 vars Supabase). MODIFIED Public surface (5 rutas auth). | [`changes/archive/auth-foundation/`](../../../changes/archive/auth-foundation/) |
