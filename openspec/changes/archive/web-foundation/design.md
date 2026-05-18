# Design: web-foundation

**Scope:** Cómo se implementa `web-foundation`. Decisiones técnicas, estructura, tradeoffs.

---

## 1. Decisiones de librerías

| Capa | Elección | Alternativas descartadas | Por qué |
|------|----------|--------------------------|---------|
| i18n | **next-intl 3.x** | next-i18next, next-international, react-intl | Native App Router + Server Components, soporta ICU MessageFormat, type-safety opcional, comunidad grande. next-i18next es Pages Router. |
| Theme | **next-themes** | Hand-rolled, CSS-only `prefers-color-scheme` | Resuelve el flash con script bloqueante; integración trivial con Tailwind `class`; persistencia en localStorage. |
| Tailwind dark | **`darkMode: 'class'`** | `'media'` | `'media'` no respeta override manual del usuario. `'class'` deja a `next-themes` controlar. |
| SEO | **Next.js Metadata API** | next-seo | Metadata API es nativa de App Router y resuelve hreflang con `alternates`. next-seo aún es Pages-first. |
| Tokens de color | **CSS variables** sobre `:root` y `.dark` | Tailwind colors hardcoded | Compatible con Shadcn/ui out-of-the-box; permite cambiar marca sin tocar JSX. |

## 2. Estructura de carpetas

```
dashboard-web/
├── messages/
│   ├── es.json                # Mensajes default
│   └── en.json
├── public/
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png   # 180x180
│   ├── icon-192.png           # maskable
│   ├── icon-512.png           # maskable
│   └── site.webmanifest
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx     # Root layout localizado
│   │   │   ├── page.tsx       # Landing
│   │   │   └── not-found.tsx
│   │   ├── api/               # Routes no localizadas (health, etc.)
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   └── manifest.ts        # opcional, alternativa a site.webmanifest
│   ├── components/
│   │   ├── seo/
│   │   │   └── JsonLd.tsx
│   │   ├── theme/
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ThemeToggle.tsx
│   │   └── i18n/
│   │       └── LocaleSwitcher.tsx
│   ├── i18n/
│   │   ├── routing.ts         # defineRouting()
│   │   ├── request.ts         # getRequestConfig() para SSR
│   │   └── navigation.ts      # createNavigation() — Link/redirect localizados
│   ├── lib/
│   │   ├── metadata.ts        # buildMetadata() helper
│   │   └── env.ts             # Validación de env vars
│   ├── middleware.ts          # next-intl middleware
│   └── styles/
│       └── globals.css        # CSS variables: light + dark
├── next.config.mjs            # createNextIntlPlugin wrap
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 3. Routing i18n

### `src/i18n/routing.ts`

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
});
```

**Por qué `as-needed`:** el default ES queda en `/` (no en `/es`). Mejora UX en el mercado primario sin penalizar SEO porque hreflang sigue siendo explícito.

### Middleware

```ts
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
```

**Excluye:** `/api/*` (rutas no localizadas) y assets estáticos.

### Server vs Client

- Server Components: `getTranslations('Namespace')` (async).
- Client Components: `useTranslations('Namespace')` (hook).
- Mensajes para client se entregan vía `<NextIntlClientProvider>` en `layout.tsx`.

## 4. Theme

### Provider

```tsx
// src/components/theme/ThemeProvider.tsx
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### Layout

```tsx
// src/app/[locale]/layout.tsx (esquema, no código final)
<html lang={locale} suppressHydrationWarning>
  <head>
    <meta name="color-scheme" content="light dark" />
  </head>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </ThemeProvider>
  </body>
</html>
```

**Orden de providers (importante):** ThemeProvider primero (controla `<html class>`), NextIntlClientProvider dentro.

**`suppressHydrationWarning`** solo en `<html>`: next-themes muta la clase pre-React y eso es esperado.

### Tokens CSS

```css
/* src/styles/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 220 90% 56%;
    /* ... resto de tokens Shadcn */
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 220 90% 56%;
    /* ... */
  }
}
```

### Tailwind

```ts
// tailwind.config.ts
export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
      },
    },
  },
};
```

## 5. SEO

### Metadata helper

```ts
// src/lib/metadata.ts
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

export function buildMetadata(input: {
  locale: string;
  path: string;       // ej: '/audit/example.com'
  title: string;
  description: string;
  ogImage?: string;
}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const canonical = `${siteUrl}${input.locale === 'es' ? '' : '/' + input.locale}${input.path}`;

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${siteUrl}${loc === 'es' ? '' : '/' + loc}${input.path}`;
  }
  languages['x-default'] = `${siteUrl}${input.path}`;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical, languages },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: 'SEO Custom Tool',
      locale: input.locale,
      type: 'website',
      images: input.ogImage ? [{ url: input.ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
    },
    robots: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
```

### `robots.ts` y `sitemap.ts`

- `app/robots.ts` lee `NEXT_PUBLIC_ALLOW_INDEXING` y emite `Disallow: /` en dev/preview.
- `app/sitemap.ts` lista rutas públicas con `alternates.languages` por entrada.

### JSON-LD

Componente server que renderiza `<script type="application/ld+json">` con el schema dado. En layout: `Organization` + `WebSite`. En páginas: `BreadcrumbList` cuando aplique.

## 6. Variables de entorno (nuevas en este change)

```
NEXT_PUBLIC_SITE_URL=https://seo-custom-tool.vercel.app
NEXT_PUBLIC_ALLOW_INDEXING=false   # true solo en prod
NEXT_PUBLIC_DEFAULT_LOCALE=es
```

Validadas en `src/lib/env.ts` con `zod` para fallar fast en build.

## 7. Tests / verificación

| Qué | Cómo |
|-----|------|
| Routing localizado | `vitest` + simulación de request `/en/about` → middleware reescribe. |
| Metadata API output | Render `generateMetadata` y `expect` shape. |
| Theme persistente | Playwright: visitar, togglear, recargar, assert clase `dark` en `<html>`. |
| Sin FOUC | Playwright con `await page.emulateMedia({ colorScheme: 'dark' })`, screenshot del primer paint. |
| hreflang presente | Fetch `/`, parsear HTML, assert `<link rel="alternate" hreflang="en">`. |
| Lighthouse SEO ≥ 95 | `@lhci/cli` en CI sobre `/` y `/en`. |

## 8. Tradeoffs aceptados

- **`as-needed` rompe simetría:** `/es/about` redirige a `/about`. Decisión: UX prima sobre simetría URL.
- **Mensajes en JSON (no en TS):** menos type-safety, más comodidad para integrar herramientas de traducción (Crowdin, Lokalise) futuras.
- **next-themes mete script bloqueante:** ~1KB en `<head>`. Aceptado a cambio de cero flash.
- **CSS vars sobre Tailwind colors:** un nivel más de indirección. Aceptado porque habilita Shadcn y theming dinámico.

## 9. Plan de rollout

1. PR único con toda la foundation (no se puede partir sin dejar el repo en estado roto).
2. Smoke en preview de Vercel: validar Lighthouse, FOUC manual, hreflang.
3. Merge → `NEXT_PUBLIC_ALLOW_INDEXING=true` solo cuando el dominio prod esté listo.
