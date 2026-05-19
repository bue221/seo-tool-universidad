# Change: auth-clerk-migration

**Status:** in-progress
**Created:** 2026-05-19
**Domain:** dashboard-web
**Spec target:** `openspec/specs/dashboard-web/spec.md` (v0.2.0 → v0.3.0)

## Why

El auth actual usa **Supabase Auth directo** (email/password vía server actions propias) y no soporta proveedores OAuth (Google, Microsoft, etc.). Agregar OAuth nativo de Supabase requiere mantener UI propia para cada flow (sign-in, sign-up, forgot, reset, callback, MFA).

El usuario ya configuró **Clerk como third-party provider en Supabase** (no como el deprecado JWT-template integration; sino el nuevo `[auth.third_party.clerk]`). Clerk provee:

- UI prefab (`<SignIn />`, `<SignUp />`, `<UserButton />`) con Google/Microsoft/etc. configurables desde dashboard.
- Manejo de sesión, MFA, password reset, magic links built-in.
- JWT con claim `role: "authenticated"` que Supabase usa para RLS.

## What

Reemplazar Supabase Auth por **Clerk como autenticación primaria**, manteniendo Supabase como base de datos con RLS validada por el JWT de Clerk.

### In scope

- Instalar `@clerk/nextjs`, configurar `ClerkProvider` y `clerkMiddleware`.
- Reemplazar páginas `/login` y `/signup` por componentes Clerk.
- **Eliminar** `/forgot-password` y `/reset-password` (Clerk maneja el flow).
- **Eliminar** todas las server actions de `_actions/` excepto `sign-out` (reescrita).
- **Eliminar** schemas Zod de auth y sus tests (el form lo maneja Clerk).
- Refactor `lib/auth.ts` → `getCurrentUser()` usa `auth()` de Clerk + fetch de `profiles` en Supabase autorizado por JWT de Clerk.
- Refactor `lib/supabase/server.ts` y `browser.ts` para inyectar `accessToken` desde Clerk.
- **Eliminar** `lib/supabase/middleware.ts` (ya no hay cookies de Supabase Auth).
- Simplificar `src/middleware.ts` combinando `clerkMiddleware` + `next-intl`.
- Actualizar `(protected)/layout.tsx` para usar `auth().protect()` o equivalente.
- Documentar `supabase/config.toml` con `[auth.third_party.clerk]` para dev local.
- Actualizar `env.ts` con keys de Clerk (publishable + secret).
- Actualizar `.env.local.example`.

### Out of scope

- Migración de usuarios existentes (no hay usuarios productivos aún; alcance académico).
- Cambios en RLS policies de Supabase (siguen funcionando con `role = 'authenticated'`).
- Configuración de providers OAuth (Google/MS) — se hace en Clerk dashboard, no en código.
- UI custom de Clerk (usamos defaults + tema dark/light sync).
- `lib/auth.test.ts` reescritura — se elimina; los caminos felices se cubren con e2e/manual.

## Acceptance criteria

1. Login con email/password (Clerk) funciona y crea sesión válida.
2. Login con Google funciona end-to-end (asumiendo provider habilitado en Clerk dashboard).
3. Rutas bajo `(protected)/*` redirigen a `/{locale}/login` si no hay sesión Clerk.
4. `supabase.from('profiles').select()` retorna data del usuario actual (RLS con JWT Clerk OK).
5. Sign-out limpia sesión Clerk y vuelve a `/{locale}/login`.
6. `npx tsc --noEmit` pasa sin nuevos errores; errores TS preexistentes de las server actions desaparecen (porque borramos esos archivos).
7. `vitest` pasa (los tests removidos no quedan colgados).
8. i18n no se rompe: middleware combinado respeta locale prefix.

## Non-goals / explicit constraints

- No se introducen organizaciones de Clerk (single-user por ahora).
- No se cachea profile en cookies; cada SSR hace fetch.
- No se usa el componente `<UserProfile />` de Clerk en esta iteración (UserMenu existente se mantiene).
