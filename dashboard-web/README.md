# dashboard-web

Frontend y orquestador del análisis SEO. Capas fundacionales activas:
- **web-foundation** — i18n (ES/EN), tema light/dark, SEO técnico (Metadata API + JSON-LD + sitemap + robots), OG dinámico, env validation.
- **ui-foundation** — Shadcn/ui (16 primitives), lucide-react icons, sonner toaster, react-hook-form + zod.

Ver también:
- [`agents.md`](./agents.md) — contrato del agente y capacidades activas.
- [`../openspec/specs/dashboard-web/spec.md`](../openspec/specs/dashboard-web/spec.md) — spec source-of-truth.
- [`../AGENTS.md`](../AGENTS.md) — arquitectura del monorepo.

## Estado del scaffold

| Change | Estado |
|--------|--------|
| `web-foundation` (archived) | ✅ Código + tests + docs. Smoke pendiente de `pnpm install`. |
| `ui-foundation` (active) | ✅ 16 primitives Shadcn + migración Toggles + Toaster + Form. Smoke pendiente de `pnpm install`. |
| `auth-foundation` (active) | ✅ Supabase SSR clients + auth routes/actions + protected layout. Smoke pendiente de `pnpm install` + Supabase env. |
| `audit-runner` (active) | ✅ `/audit` flow con PageSpeed + scraper en paralelo, snapshot persistido y vista detalle por tabs. |
| `gbp-simulator` (active) | ✅ Módulo `/gbp` con profile, posts, reviews e insights base sobre Supabase. |
| `analytics-dashboard` (active) | ✅ Módulo `/analytics` con KPIs base de snapshots. |

> Los archivos fueron **scaffolded a mano** (sin correr `pnpm create next-app`)
> porque la red corporativa de MELI bloquea el registry público y el artifactory
> de Fury devuelve 403. Cuando se destrabe la red basta con `pnpm install`.

## Quickstart

```bash
# 1) Verificar red
dig +short +time=3 +tries=1 registry.npmjs.org
# Debe devolver al menos una IP. Si nada, conecta hotspot del celular o
# agrega 8.8.8.8 en System Settings → Network → DNS.

# 2) Variables de entorno
cp .env.local.example .env.local
# Editar al menos NEXT_PUBLIC_SITE_URL si no es http://localhost:3000

# 3) Instalar (el .npmrc local fuerza registry público)
pnpm install     # ó: npm install

# 4) Dev
pnpm dev
# → http://localhost:3000 (ES)
# → http://localhost:3000/en (EN)

# 5) Build de verificación
pnpm build
```

## Scripts

| Comando | Qué hace |
|---------|----------|
| `pnpm dev` | Dev server con HMR. |
| `pnpm build` | Build de producción (incluye validación zod del env). |
| `pnpm start` | Sirve el build estático. |
| `pnpm lint` | ESLint + reglas de Next. |
| `pnpm typecheck` | `tsc --noEmit`. |
| `pnpm test` | Vitest (cuando se agreguen tests en sección 5). |

## Variables de entorno

Las `NEXT_PUBLIC_*` se validan en build vía [`src/lib/env.ts`](./src/lib/env.ts) con zod. Si falta una requerida, `pnpm build` falla con mensaje claro — deseado para no descubrir el problema en prod.

Ver [`.env.local.example`](./.env.local.example) para la lista completa.

## Estructura

```
dashboard-web/
├── messages/                   # Catálogos i18n por locale
│   ├── es.json                 # default
│   └── en.json
├── public/                     # Assets estáticos (vacío — favicons son dinámicos)
└── src/
    ├── app/
    │   ├── [locale]/
    │   │   ├── layout.tsx              # Providers (Theme→Intl), metadata global, JSON-LD
    │   │   ├── page.tsx                # Home con generateMetadata + demo
    │   │   ├── not-found.tsx           # 404 localizado
    │   │   ├── opengraph-image.tsx     # OG 1200x630 por locale (ImageResponse)
    │   │   └── twitter-image.tsx       # Re-export del OG (mismo ratio)
    │   ├── icon.tsx                    # Favicon 32x32 dinámico
    │   ├── apple-icon.tsx              # Apple touch 180x180 dinámico
    │   ├── manifest.ts                 # webmanifest PWA
    │   ├── robots.ts                   # robots.txt condicional
    │   └── sitemap.ts                  # sitemap.xml con hreflang
    ├── components/
    │   ├── i18n/LocaleSwitcher.tsx     # Segmented ES/EN (ToggleGroup)
    │   ├── seo/JsonLd.tsx              # + buildSiteSchemas, buildBreadcrumb
    │   ├── theme/
    │   │   ├── ThemeProvider.tsx       # Wrap de next-themes
    │   │   └── ThemeToggle.tsx         # Segmented Light/Dark/System (ToggleGroup + lucide)
    │   └── ui/                         # Shadcn primitives (16 archivos)
    │       ├── button.tsx              # variantes default/destructive/outline/secondary/ghost/link
    │       ├── input.tsx, label.tsx, badge.tsx
    │       ├── card.tsx                # Card + Header/Title/Description/Content/Footer
    │       ├── tabs.tsx, dialog.tsx, sheet.tsx
    │       ├── tooltip.tsx, dropdown-menu.tsx
    │       ├── toggle.tsx, toggle-group.tsx
    │       ├── separator.tsx, skeleton.tsx
    │       ├── form.tsx                # react-hook-form bridge
    │       └── sonner.tsx              # Toaster con next-themes sync
    ├── i18n/
    │   ├── routing.ts                  # defineRouting (locales, default, prefix)
    │   ├── request.ts                  # getRequestConfig + carga de messages
    │   └── navigation.ts               # createNavigation (Link, useRouter localizados)
    ├── lib/
    │   ├── env.ts                      # Validación zod del entorno
    │   ├── metadata.ts                 # buildMetadata + localizedUrl
    │   └── utils.ts                    # cn() helper (clsx + tailwind-merge)
    ├── middleware.ts                   # createMiddleware (rewrites por locale)
    └── styles/
        └── globals.css                 # Tailwind base + tokens HSL light/dark
```

## Cómo... (cookbook)

### Agregar un nuevo locale (ej. `pt`)

1. Agregar a `src/i18n/routing.ts`:
   ```ts
   locales: ['es', 'en', 'pt'],
   ```
2. Crear `messages/pt.json` copiando `es.json` y traduciendo.
3. Actualizar `src/lib/env.ts` (`NEXT_PUBLIC_DEFAULT_LOCALE` enum).
4. El sitemap y los hreflang se actualizan automáticamente (recorren `routing.locales`).

### Agregar una ruta pública al sitemap

Editar `src/app/sitemap.ts` y agregar al array `PUBLIC_PATHS`:

```ts
const PUBLIC_PATHS = ['/', '/about', '/docs'] as const;
```

Cada entry se expande con `alternates.languages` por locale automáticamente.

### Implementar `generateMetadata` en una page nueva

```tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing, type Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/metadata';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const valid: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const t = await getTranslations({ locale: valid, namespace: 'MyPage' });

  return buildMetadata({
    locale: valid,
    path: '/my-page',     // path canonical SIN prefijo de locale
    title: t('title'),
    description: t('description'),
  });
}
```

### Agregar un componente Shadcn nuevo

Cuando hay red disponible, el CLI lo hace todo:

```bash
pnpm dlx shadcn@latest add <componente>
# ej: pnpm dlx shadcn@latest add accordion
```

Eso descarga el código a `src/components/ui/<componente>.tsx` y agrega las
deps Radix que correspondan al `package.json`. **Sin red**, copiar a mano desde
https://ui.shadcn.com/docs/components/<componente> y agregar la dep Radix
correspondiente a `package.json`.

### Crear un formulario con validación zod

```tsx
'use client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const schema = z.object({ url: z.string().url('URL inválida') });

export function AuditForm() {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { url: '' } });
  function onSubmit(data: z.infer<typeof schema>) {
    toast.success('Auditoría iniciada', { description: data.url });
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl><Input placeholder="https://ejemplo.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Auditar</Button>
      </form>
    </Form>
  );
}
```

### Disparar un toast

```tsx
import { toast } from 'sonner';

toast('Mensaje neutro');
toast.success('Listo', { description: 'Operación completada' });
toast.error('Error', { description: 'No se pudo conectar al scraper' });
toast.promise(fetch('/api/audit'), {
  loading: 'Auditando...',
  success: 'Auditoría completa',
  error: 'Falló la auditoría',
});
```

El `<Toaster />` ya está montado en `app/[locale]/layout.tsx` y respeta el
tema activo (light/dark/system).

### Hacer indexable la app en producción

```bash
# En .env.local (prod):
NEXT_PUBLIC_ALLOW_INDEXING=true
```

Eso cambia 3 cosas a la vez:
- `<meta name="robots">` → `index,follow`.
- `/robots.txt` → `allow: /` + sitemap reference.
- (El sitemap ya existe en ambos modos.)

### Override de tema de un componente puntual

El theme se aplica vía clase `dark` en `<html>`. Para forzar light en un widget específico (raro), envolver en `<div className="light">` no funciona — `next-themes` usa solo `.dark`. Si necesitas un widget "forced", usar variants explícitos:

```tsx
<div className="bg-white text-black dark:bg-white dark:text-black">
  forced light
</div>
```

## Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **i18n:** next-intl 4 con `localePrefix: 'as-needed'`
- **Theme:** next-themes 0.4 + Tailwind `darkMode: 'class'`
- **Estilos:** Tailwind 3.4 + CSS variables HSL + `tailwindcss-animate`
- **UI library:** Shadcn/ui (style `default`, baseColor `neutral`)
- **Iconos:** lucide-react
- **Forms:** react-hook-form + `@hookform/resolvers/zod`
- **Toasts:** sonner (integrado con next-themes)
- **Variants:** class-variance-authority (cva)
- **TypeScript:** strict, import alias `@/*` → `./src/*`
- **Env validation:** zod 3
- **Auth/DB clients:** @supabase/ssr + @supabase/supabase-js
- **Lint:** ESLint 9 con `next/core-web-vitals` + `next/typescript`

## Limitaciones conocidas

- **Sin `pnpm install`** todavía → linter/IDE marca errores de import en `next-intl` y `next-themes`. Se resuelven al instalar.
- **`public/` está vacío** — todos los iconos y OG son `ImageResponse`. Si en algún momento se necesita un asset estático binario (logo SVG, etc.), va acá.
- **El theme `system` no respeta el cambio en tiempo real del OS** sin recargar; es comportamiento estándar de `next-themes`. Si se requiere live-update, escuchar `matchMedia('(prefers-color-scheme: dark)')`.
