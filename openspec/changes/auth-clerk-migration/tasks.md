# Tasks: auth-clerk-migration

Estimated changed lines: ~450 (mostly deletions). Within review budget (500).

## Setup

- [x] T1. `@clerk/nextjs` + `@clerk/localizations` declarados en `dashboard-web/package.json`. Install pendiente del usuario.
- [x] T2. `src/lib/env.ts` extendido con keys Clerk (publishable + secret + sign-in/up URLs).
- [x] T3. `.env.local.example` actualizado.
- [x] T4. `dashboard-web/supabase/config.toml` creado con `[auth.third_party.clerk]`. Placeholder de dominio a reemplazar.

## Middleware y providers

- [x] T5. `src/middleware.ts` reescrito: `clerkMiddleware(...)` con `auth.protect()` + `intlMiddleware`. Public routes: `/`, `/{locale}`, `/{locale}/login(.*)`, `/{locale}/signup(.*)`.
- [x] T6. `[locale]/layout.tsx` envuelto con `<ClerkProvider localization={locale === 'es' ? esES : enUS}>`.
- [x] T7. `src/lib/supabase/middleware.ts` eliminado.

## Supabase clients (Clerk JWT)

- [x] T8. `src/lib/supabase/server.ts` usa `@supabase/supabase-js` plano con `accessToken: () => auth().getToken()`.
- [x] T9. `src/lib/supabase/browser.ts` ahora exporta hook `useSupabase()` con `useSession().getToken()`.

## Auth helper

- [x] T10. `src/lib/auth.ts` reescrito con `auth()` + `currentUser()` + fetch profile.
- [x] T11. `src/lib/auth.test.ts` eliminado.

## Páginas auth

- [x] T12. `/[locale]/login/page.tsx` → `<SignIn path="/{locale}/login" routing="path" forceRedirectUrl="/{locale}/dashboard" />`.
- [x] T13. `/[locale]/signup/page.tsx` → idem con `<SignUp />`.
- [x] T14. `/forgot-password/` y `/reset-password/` eliminados.
- [x] T15. Server actions Supabase Auth eliminadas (sign-in/up, request-password-reset, update-password, schemas + test).
- [x] T16. `_actions/sign-out.ts` queda como stub vacío; sign-out real vía `<SignOutButton>`.
- [x] T17. `(auth)/layout.tsx` simplificado (sin Card wrapper, Clerk trae el suyo).

## Rutas protegidas

- [x] T18. `(protected)/layout.tsx` sigue usando `getCurrentUser()` (ahora resuelve Clerk). Pasa `locale` al `UserMenu`.
- [x] T19. `UserMenu` usa `<SignOutButton redirectUrl={`/{locale}/login`}>`.

## i18n

- [ ] T20. **Skipped** — las keys `Auth.Login`, `Auth.Signup`, `Auth.ForgotPassword`, `Auth.ResetPassword` quedan inertes pero no rompen. Cleanup en otra iteración.

## Verify (BLOQUEADO HASTA NPM INSTALL)

- [ ] T21. `npx tsc --noEmit` — pendiente de `npm install` en `dashboard-web/`.
- [ ] T22. `vitest run` — pendiente.
- [ ] T23. `npm run build` — pendiente.
- [ ] T24. Manual smoke: login email, login Google, acceso a `/dashboard`, sign-out.
- [x] T25. `openspec/specs/dashboard-web/spec.md` actualizado a v0.3.0.
- [ ] T26. Archivar change → pendiente verify exitoso.

## Tareas DB para el usuario (fuera del repo)

- [ ] DB1. Reemplazar `REPLACE_WITH_YOUR_CLERK_FRONTEND_API_DOMAIN` en `supabase/config.toml` con el dominio real de Clerk (ej. `xxx.clerk.accounts.dev`).
- [ ] DB2. Si `profiles.user_id` o `seo_snapshots.user_id` son `uuid`, migrar a `text` (Clerk IDs son strings `user_xxx`).
- [ ] DB3. Revisar RLS policies: reemplazar `auth.uid()` por `auth.jwt() ->> 'sub'`.
