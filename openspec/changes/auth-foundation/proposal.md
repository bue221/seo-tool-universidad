# Proposal: auth-foundation

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-18
**Depends on:** [`web-foundation`](../archive/web-foundation/) + [`ui-foundation`](../archive/ui-foundation/) (archived).

---

## ¿Por qué?

`dashboard-web` v0.2.0 tiene UI, i18n, theme, SEO — pero no tiene **identidad de usuario**. Sin auth no podemos:

- Atar audits a un dueño (la tabla `seo_snapshots` necesita `user_id`).
- Proteger el módulo GBP (cada negocio tiene un dueño).
- Mostrar histórico personal en `/analytics`.
- Hacer RLS en Supabase para que cada usuario solo vea sus datos.

Auth es **prerrequisito duro** de `audit-runner`, `gbp-simulator` y `analytics-dashboard`. Meterla ahora antes de tocar el producto evita re-trabajar layouts, server actions y queries más adelante.

## ¿Qué?

### Alcance (in-scope)

1. **Cliente Supabase SSR** con `@supabase/ssr` (el oficial moderno; no la deprecada `@supabase/auth-helpers-nextjs`):
   - `src/lib/supabase/server.ts` — `createClient()` lee cookies del request (Server Components / Server Actions / Route Handlers).
   - `src/lib/supabase/browser.ts` — `createBrowserClient()` para Client Components.
   - `src/lib/supabase/middleware.ts` — `updateSession(request)` refresh cookies y pasa al handler.
2. **Esquema Supabase**:
   - Tabla `public.profiles` (FK a `auth.users`, RLS habilitado, trigger de auto-insert al `auth.users.created`).
   - Migración SQL versionada en `dashboard-web/supabase/migrations/0001_profiles.sql`.
3. **Server actions de auth** en `src/app/[locale]/(auth)/_actions/`:
   - `signIn(email, password)`, `signUp(email, password, displayName)`, `signOut()`, `requestPasswordReset(email)`, `updatePassword(token, newPassword)`.
   - Shape de retorno: `{ ok: true, data? } | { ok: false, error: { code, message } }`.
4. **Páginas públicas**:
   - `/[locale]/login`.
   - `/[locale]/signup`.
   - `/[locale]/forgot-password`.
   - `/[locale]/reset-password` (callback del email).
5. **Layout autenticado**: route group `app/[locale]/(protected)/` con su propio `layout.tsx` que:
   - Llama `getCurrentUser()` server-side.
   - Si null → `redirect('/login')`.
   - Renderiza navbar con `<LocaleSwitcher>`, `<ThemeToggle>`, `<UserMenu>` (dropdown con email + signOut).
6. **Página inicial protegida**: `/[locale]/(protected)/dashboard` con welcome message y link a futuras features.
7. **Middleware actualizado**: `src/middleware.ts` envuelve el matcher existente + llama `updateSession` para refrescar cookies. El route guard formal va en el layout `(protected)/`.
8. **Helper `getCurrentUser()`** server-only que devuelve `User | null`. Importable como `import { getCurrentUser } from '@/lib/auth'`.
9. **i18n**: namespaces nuevos `Auth.Common`, `Auth.Login`, `Auth.Signup`, `Auth.ForgotPassword`, `Auth.ResetPassword`, `Auth.Dashboard`, `Auth.UserMenu`.
10. **Env vars nuevas** (validadas con zod en `src/lib/env.ts`):
    - `NEXT_PUBLIC_SUPABASE_URL` (público).
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (público).
    - `SUPABASE_SERVICE_ROLE_KEY` (server-only — nuevo schema `serverEnvSchema`).
11. **Forms** usando `Form` + `FormField` + `Input` + `Button` de `@/components/ui/*` con `react-hook-form` + `zodResolver`.
12. **Toasts** via `sonner` para feedback (success/error).

### No-objetivos (out-of-scope explícito)

- **No** OAuth (Google, GitHub, etc.) — futuro change `auth-oauth`.
- **No** MFA / 2FA — futuro change `auth-mfa`.
- **No** magic link login — solo email+password en este change.
- **No** email templates customizados — defaults de Supabase alcanzan.
- **No** admin panel / role-based access control — futuro.
- **No** profile editor (display_name update) — un cuadro en `/dashboard` no más; CRUD completo es feature.
- **No** delete account — futuro change.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| `@supabase/ssr` aún se itera (v0.5.x). Breaking changes posibles. | Pinear versión `^0.5.0`; documentar el pattern de cookie-handling en design.md. Cuando salga v1, hacer un MODIFIED change explícito. |
| Race condition: cookie refresh en middleware vs Server Component que lee user | El pattern oficial de Supabase es: middleware refreshea, Server Component lee de cookies ya frescas. Documentar orden de middleware en design.md. |
| RLS mal configurada filtra datos entre usuarios | Tests manuales de smoke: crear 2 usuarios, hacer un INSERT desde uno, verificar que el otro no lee. Documentar en `SMOKE.md`. |
| `SUPABASE_SERVICE_ROLE_KEY` se filtra al bundle del cliente | Schema zod separado server-only. Importar `serverEnv` SOLO desde código que tenga `'use server'` o esté en `app/api/`. ESLint rule futura para enforcing. |
| Locale-aware redirects post-login (e.g. `/en/dashboard` no `/dashboard`) | Usar `redirect` de `@/i18n/navigation` (localizado), no de `next/navigation`. |
| Trigger de `auth.users → profiles` falla y deja usuario sin profile | Política defensiva: `getCurrentUser()` también devuelve profile (left join). Si profile null, crea uno on-demand. |

## Métricas de éxito

- Crear usuario nuevo + verificar email + login funciona end-to-end en preview de Vercel.
- `/dashboard` redirige a `/login` si no hay sesión.
- `/login` redirige a `/dashboard` si ya hay sesión.
- RLS: 2 usuarios distintos NO pueden ver datos del otro (smoke manual con `seo_snapshots` apenas exista).
- Cookies session válidas durante el lifetime configurado por Supabase (default 1h, refresh automático).
- Lighthouse a11y ≥ 0.90 sigue cumpliendo en formularios de auth (light + dark).
- Sin warnings en consola por `cookies()` async (Next 15 quiere `await cookies()`).

## Referencias

- Spec activa: [`openspec/specs/dashboard-web/spec.md`](../../specs/dashboard-web/spec.md) v0.2.0 — esta foundation la modifica.
- Docs: https://supabase.com/docs/guides/auth/server-side/nextjs
