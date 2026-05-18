# Tasks: auth-foundation

> Marcar `[x]` al completar. Orden de dependencia entre secciones.

---

## 0. Dependencias

- [ ] Agregar a `dashboard-web/package.json`:
  - `dependencies`: `@supabase/ssr@^0.5.0`, `@supabase/supabase-js@^2.45.0`.
- [ ] `pnpm install` (bloqueado por red).
- [ ] Configurar Supabase project:
  - [ ] Crear nuevo project en supabase.com (o reutilizar `qjfnizfeikphlmteuuda` del `.mcp.json`).
  - [ ] Copiar `URL`, `anon key`, `service role key` a `.env.local`.
  - [ ] **Verificar email confirmation**: por default ON. Considerar OFF en dev para acelerar smoke.

## 1. Esquema Supabase

- [ ] `dashboard-web/supabase/migrations/0001_profiles.sql` con:
  - Tabla `public.profiles`.
  - Función + trigger `handle_new_user` para auto-insert al crear usuario en `auth.users`.
  - Función + trigger `touch_updated_at`.
  - Políticas RLS (read own, update own).
- [ ] Aplicar migración via `supabase db push` (cuando CLI esté instalado) o SQL editor del dashboard.
- [ ] Smoke: crear usuario manual en Supabase Auth dashboard → verificar que aparece fila en `public.profiles`.

## 2. Validación env

- [ ] `src/lib/env.ts`:
  - [ ] Extender `publicEnvSchema` con `NEXT_PUBLIC_SUPABASE_URL` (URL) y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (min 20 chars).
  - [ ] Agregar `serverEnvSchema` con `SUPABASE_SERVICE_ROLE_KEY` (min 20 chars).
  - [ ] Exportar `serverEnv` (segundo export, separado).
- [ ] Actualizar `.env.local.example` con las 3 vars nuevas comentadas.

## 3. Clientes Supabase

- [ ] `src/lib/supabase/server.ts` — `createClient()` async con `cookies()` de Next 15.
- [ ] `src/lib/supabase/browser.ts` — `createClient()` (no async) con `createBrowserClient`.
- [ ] `src/lib/supabase/middleware.ts` — `updateSession(request)` que refresca cookies y llama `supabase.auth.getUser()` (crítico — no remover).

## 4. Middleware

- [ ] Editar `src/middleware.ts`:
  - Importar `updateSession` de `@/lib/supabase/middleware`.
  - Ejecutar `updateSession(request)` antes de `createIntlMiddleware(routing)(request)`.
  - Si intl devuelve redirect/rewrite, copiar cookies del response de Supabase al response final.
  - Mantener `matcher` igual.

## 5. Helpers

- [ ] `src/lib/auth.ts` con `getCurrentUser()` — devuelve `{ id, email, displayName } | null`. Hace fetch del profile asociado al user.

## 6. Server actions

- [ ] `src/app/[locale]/(auth)/_actions/sign-in.ts` (`signIn(formData)`).
- [ ] `src/app/[locale]/(auth)/_actions/sign-up.ts` (`signUp(formData)`).
- [ ] `src/app/[locale]/(auth)/_actions/sign-out.ts` (`signOut()`).
- [ ] `src/app/[locale]/(auth)/_actions/request-password-reset.ts`.
- [ ] `src/app/[locale]/(auth)/_actions/update-password.ts`.
- [ ] Todas con: `'use server'`, validación zod, retorno `{ ok, error?, data? }` o `redirect()` localizado.

## 7. Páginas públicas auth

- [ ] `src/app/[locale]/(auth)/layout.tsx` — layout centrado con `<Card>` + logo + LocaleSwitcher + ThemeToggle.
- [ ] `src/app/[locale]/(auth)/login/page.tsx` — Form con email + password + submit + link a signup + link a forgot.
- [ ] `src/app/[locale]/(auth)/signup/page.tsx` — Form con email + password + displayName + submit + link a login.
- [ ] `src/app/[locale]/(auth)/forgot-password/page.tsx` — Form con email + submit + link a login.
- [ ] `src/app/[locale]/(auth)/reset-password/page.tsx` — Form con newPassword + confirmPassword + submit (lee token del query string).
- [ ] Todos los forms con `useForm({ resolver: zodResolver(schema) })`, llaman la server action, hacen `toast.success/error`.

## 8. Layout protegido

- [ ] `src/app/[locale]/(protected)/layout.tsx`:
  - Llama `getCurrentUser()`.
  - Si null → `redirect({ href: '/login', locale })`.
  - Renderiza header con LocaleSwitcher + ThemeToggle + UserMenu.
- [ ] `src/app/[locale]/(protected)/_components/UserMenu.tsx` — `DropdownMenu` con email displayed + signOut item.

## 9. Página inicial protegida

- [ ] `src/app/[locale]/(protected)/dashboard/page.tsx` — welcome con `Card`, mensaje "Hola {displayName}" + links a `/audit`, `/gbp`, `/analytics` (placeholders por ahora).

## 10. i18n

- [ ] Agregar a `messages/es.json` namespaces nuevos: `Auth.Common`, `Auth.Login`, `Auth.Signup`, `Auth.ForgotPassword`, `Auth.ResetPassword`, `Auth.Dashboard`, `Auth.UserMenu`.
- [ ] Agregar equivalentes a `messages/en.json`.

## 11. Tests

- [ ] Test unit (`vitest`): `src/lib/auth.test.ts` — mock de `createClient()`, verifica que `getCurrentUser()` retorna shape correcta para user con/sin profile.
- [ ] Test unit: schemas zod de cada server action.
- [ ] Smoke e2e (manual):
  - [ ] `/dashboard` sin sesión → redirect `/login`.
  - [ ] Login con credenciales válidas → cookies seteadas + redirect `/dashboard`.
  - [ ] Signup → email confirmation → click link → redirect `/dashboard`.
  - [ ] Logout → redirect `/login`.
  - [ ] 2 usuarios distintos: cada uno solo ve su profile (RLS).

## 12. Documentación

- [ ] Actualizar `dashboard-web/README.md`:
  - [ ] Estado del scaffold: agregar fila `auth-foundation`.
  - [ ] Stack: mencionar `@supabase/ssr`.
  - [ ] Cookbook nueva receta: "proteger una página".
  - [ ] Cookbook nueva receta: "crear un server action de auth".
- [ ] Actualizar `dashboard-web/agents.md`:
  - Tabla de capacidades: agregar `Authentication`, `User Identity`.
  - Invariantes nuevas (11–13): rutas autenticadas solo en `(protected)/`; server actions con shape `{ ok, error?, data? }`; nunca importar `serverEnv` desde Client Component.
  - Roadmap: marcar `auth-foundation` activo, indicar que `audit-runner`/`gbp-simulator`/`analytics-dashboard` ya lo pueden consumir.
- [ ] Actualizar `dashboard-web/SMOKE.md`:
  - Sección nueva: smoke auth (signup, login, logout, guard, RLS).

## 13. Cierre

- [ ] PR título: `feat(web): Supabase SSR auth foundation [auth-foundation]`.
- [ ] Validar specs: review manual del delta.
- [ ] Archive equivalente offline:
  - Promover delta a `openspec/specs/dashboard-web/spec.md` (v0.3.0).
  - Mover change a `openspec/changes/archive/auth-foundation/` con banner ARCHIVED.
- [ ] Actualizar `openspec/README.md` y `AGENTS.md` raíz.
