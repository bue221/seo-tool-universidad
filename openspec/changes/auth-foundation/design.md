# Design: auth-foundation

**Scope:** Cómo se implementa `auth-foundation`. Decisiones de libs, estructura, flujos, esquema SQL, tradeoffs.

---

## 1. Decisiones de librerías

| Capa | Elección | Alternativas descartadas | Por qué |
|------|----------|--------------------------|---------|
| Cliente Supabase SSR | **`@supabase/ssr ^0.5.0`** | `@supabase/auth-helpers-nextjs` | `auth-helpers-nextjs` está deprecada. `@supabase/ssr` es el sucesor oficial, soporta App Router nativo, cookie handling correcto. |
| Validación | **`zod`** (ya activo) | yup, valibot | Ya usado en env validation; consistencia. |
| Form bridge | **`react-hook-form + zodResolver`** (ya activos por `ui-foundation`) | Server Actions sin RHF (FormData parseada manual) | RHF da type-safety + UX optimista + integración perfecta con `Form` de Shadcn. |
| Routing localizado de redirects | **`redirect` de `@/i18n/navigation`** | `redirect` de `next/navigation` | El de `next-intl` preserva locale; el de `next/navigation` puede romper hreflang. |

## 2. Estructura de carpetas

```
dashboard-web/
├── supabase/
│   └── migrations/
│       └── 0001_profiles.sql           # Schema + trigger + RLS
└── src/
    ├── app/
    │   └── [locale]/
    │       ├── (auth)/                 # Route group para páginas públicas auth
    │       │   ├── login/page.tsx
    │       │   ├── signup/page.tsx
    │       │   ├── forgot-password/page.tsx
    │       │   ├── reset-password/page.tsx
    │       │   ├── layout.tsx          # Layout simple centrado (Card)
    │       │   └── _actions/
    │       │       ├── sign-in.ts
    │       │       ├── sign-up.ts
    │       │       ├── sign-out.ts
    │       │       ├── request-password-reset.ts
    │       │       └── update-password.ts
    │       └── (protected)/            # Route group para todo lo autenticado
    │           ├── layout.tsx          # Guard + navbar
    │           ├── dashboard/page.tsx  # Welcome page mínima
    │           └── _components/
    │               └── UserMenu.tsx    # Dropdown con email + signOut
    ├── lib/
    │   ├── supabase/
    │   │   ├── server.ts               # createClient() server-side
    │   │   ├── browser.ts              # createBrowserClient() client-side
    │   │   └── middleware.ts           # updateSession(request)
    │   ├── auth.ts                     # getCurrentUser(), authActions helpers
    │   └── env.ts                      # MODIFIED: agregar publicEnv + serverEnv schemas
    └── middleware.ts                   # MODIFIED: agregar updateSession
```

## 3. Esquema SQL

```sql
-- supabase/migrations/0001_profiles.sql

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger: al crear un usuario en auth.users, insertar profile correspondiente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: solo el dueño lee/escribe su profile.
alter table public.profiles enable row level security;

create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
```

## 4. Flujo de auth (signup → confirm → login)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser    │     │  Next Server │     │  Supabase    │
└──────┬──────┘     └──────┬───────┘     └──────┬───────┘
       │                   │                    │
       │ POST /signup form │                    │
       ├──────────────────►│                    │
       │                   │ signUp({email,pwd})│
       │                   ├───────────────────►│
       │                   │                    │
       │                   │   user created     │
       │                   │   email enviado    │
       │                   │◄───────────────────┤
       │ toast "revisa     │                    │
       │  tu email"        │                    │
       │◄──────────────────┤                    │
       │                   │                    │
       │  (user click email link)               │
       │                   │                    │
       │ GET /auth/confirm │                    │
       ├──────────────────►│                    │
       │                   │ exchangeCodeForSes │
       │                   ├───────────────────►│
       │                   │  sessión + cookies │
       │                   │◄───────────────────┤
       │                   │                    │
       │ redirect          │                    │
       │ /dashboard        │                    │
       │◄──────────────────┤                    │
```

## 5. Setup de clientes Supabase

### `src/lib/supabase/server.ts`

```ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // En Server Components puros (no actions/handlers), set falla.
            // Eso es OK — middleware refresca cookies en el próximo request.
          }
        },
      },
    },
  );
}
```

### `src/lib/supabase/browser.ts`

```ts
'use client';
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

### `src/lib/supabase/middleware.ts`

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // CRÍTICO: NO eliminar esta línea — fuerza el refresh del token.
  await supabase.auth.getUser();

  return response;
}
```

### `src/middleware.ts` (MODIFICADO)

```ts
import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 1. Refresh sesión Supabase (cookies actualizadas).
  const supabaseResponse = await updateSession(request);

  // 2. Aplicar middleware de i18n (matcher restringe rutas).
  const intlResponse = intlMiddleware(request);

  // Si intl dispara redirect/rewrite, prevalecen sus headers; sino los de Supabase.
  if (intlResponse.headers.get('location')) {
    // Copiar cookies refrescadas al response de intl.
    supabaseResponse.cookies.getAll().forEach((c) =>
      intlResponse.cookies.set(c.name, c.value, c),
    );
    return intlResponse;
  }
  return supabaseResponse;
}

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
```

## 6. `getCurrentUser()` helper

```ts
// src/lib/auth.ts
import { createClient } from '@/lib/supabase/server';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch profile asociado (left join lógico).
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    displayName: profile?.display_name ?? null,
  };
}
```

## 7. Layout protegido — guard pattern

```tsx
// src/app/[locale]/(protected)/layout.tsx
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from './_components/UserMenu';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Separator } from '@/components/ui/separator';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect({ href: '/login', locale: 'es' /* TODO: leer locale actual */ });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-sm font-semibold tracking-tight">SEO Custom Tool</span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Separator orientation="vertical" className="h-6" />
          <ThemeToggle />
          <Separator orientation="vertical" className="h-6" />
          <UserMenu email={user.email!} displayName={user.displayName} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

## 8. Server actions — shape estándar

```ts
// src/app/[locale]/(auth)/_actions/sign-in.ts
'use server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/navigation';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type Result = { ok: true } | { ok: false; error: { code: string; message: string } };

export async function signIn(formData: FormData): Promise<Result> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION', message: 'Datos inválidos' } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: { code: 'AUTH_FAILED', message: error.message } };
  }

  redirect({ href: '/dashboard', locale: 'es' });
}
```

**Invariantes server actions:**
- `'use server'` al tope del archivo (toda función exportada será una action).
- Retorno `{ ok, error?, data? }` (excepto cuando hace `redirect()` que lanza).
- Validación con zod siempre.
- No exponer `error.stack` ni detalles internos al cliente — solo `error.code` + `error.message` localizable.

## 9. Env validation (extensión)

```ts
// src/lib/env.ts — schemas separados
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_ALLOW_INDEXING: z.enum(['true','false']).default('false').transform(v => v === 'true'),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(['es','en']).default('es'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

export const env = publicEnvSchema.parse(/* ... */);

// Export separado server-only — NUNCA importar desde Client Components.
export const serverEnv = serverEnvSchema.parse(/* ... */);
```

**Cómo prevenir import accidental desde cliente:** Next.js inlinea `NEXT_PUBLIC_*` al bundle. `serverEnv` queda undefined en client → error obvio en runtime. Plus ESLint rule futura: `no-restricted-imports` en `*.tsx` Client Components.

## 10. Manejo de errores y traducciones

| Código error | Mensaje (key i18n) |
|--------------|--------------------|
| `VALIDATION` | `Auth.Common.errors.validation` |
| `AUTH_FAILED` | `Auth.Login.errors.failed` |
| `EMAIL_TAKEN` | `Auth.Signup.errors.emailTaken` |
| `WEAK_PASSWORD` | `Auth.Signup.errors.weakPassword` |
| `RESET_LINK_INVALID` | `Auth.ResetPassword.errors.linkInvalid` |
| `UNKNOWN` | `Auth.Common.errors.unknown` |

El componente que llama la action recibe `{ ok: false, error: { code } }` y hace `toast.error(t(\`errors.\${code}\`))`.

## 11. Tradeoffs aceptados

- **Email confirmation obligatorio por default** (Supabase default). Pro: previene cuentas falsas. Contra: UX más pesada. Aceptamos por seguridad. Configurable después en Supabase dashboard si queremos `disable email confirmation`.
- **Cookies HTTP-only** manejadas por `@supabase/ssr` automáticamente. No exponemos al JS del cliente.
- **No tenemos remember-me checkbox** — sesión persistente es el default (Supabase configura 1h access token + refresh token de 7d). Aceptable para mvp.
- **No tenemos rate-limiting custom**. Supabase ya limita (algunas reqs por minuto). Si abusamos, ellos lo bloquean.
- **No usamos `@supabase/auth-ui-react`** (la lib oficial de UI). Construimos nuestros forms con `ui-foundation` para uniformidad visual.

## 12. Plan de rollout

1. PR único que entrega todo. No mergeable parcial (sin guard, sin user = roto).
2. Configurar Supabase project apenas se mergee: crear el project, copiar URL/keys, correr la migración SQL.
3. Smoke: crear usuario, confirmar email, login, ver `/dashboard`.
4. Merge → habilita `audit-runner` y `gbp-simulator` para que usen `getCurrentUser()` directamente.
