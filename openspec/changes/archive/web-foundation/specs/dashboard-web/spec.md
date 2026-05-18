# Delta: dashboard-web @ web-foundation

> ⚠️ **ARCHIVED — 2026-05-18.** Este delta fue promovido a la spec oficial.
> Ver [`openspec/specs/dashboard-web/spec.md`](../../../../../specs/dashboard-web/spec.md)
> para el estado actual de la capability. Este archivo se preserva como histórico
> del change que la introdujo.

---

## ADDED — Capability: Internationalization (i18n)

### Locales soportados

- `es` — Español (default).
- `en` — English.

### Routing

- Estrategia de prefijo: **`as-needed`**.
  - `/` → ES.
  - `/en/...` → EN.
  - `/es/...` redirige a `/...` (canonical).
- Locales no soportados retornan **404** (no fallback silencioso).
- El segmento dinámico es `app/[locale]/`.

### API de traducción

- **Server Components:** `await getTranslations('Namespace')`.
- **Client Components:** `useTranslations('Namespace')` (dentro de `NextIntlClientProvider`).
- **Namespaces obligatorios:** `Common`, `HomePage`. Otros namespaces se agregan por feature.
- **Formato de mensajes:** ICU MessageFormat (soporta interpolación, plurales, selects).
- **Origen:** archivos `messages/<locale>.json` en el root de `dashboard-web/`.

### Locale switcher

- Componente público `LocaleSwitcher` que preserva el `pathname` actual al cambiar.
- Implementado con `usePathname` + `useRouter` de `@/i18n/navigation` (no de `next/navigation`).

### Reglas de invariantes

- Toda página dentro de `app/[locale]/` **debe** invocar `setRequestLocale(locale)` en su layout o page.
- Ningún string visible al usuario puede estar hardcodeado en JSX; debe pasar por `t(...)`.

---

## ADDED — Capability: Theme (light / dark / system)

### Modos soportados

- `light`, `dark`, `system` (default).
- `system` respeta `prefers-color-scheme` del OS.
- El usuario puede override y la elección persiste en `localStorage` (clave `theme`).

### Implementación

- Provider: `next-themes` con `attribute="class"`, `defaultTheme="system"`, `enableSystem`.
- Tailwind: `darkMode: 'class'`.
- Tokens: CSS variables en `:root` (light) y `.dark` (dark), formato HSL sin función (ej. `0 0% 100%`) para componerlos con `hsl(var(--token) / <alpha>)`.

### Invariantes

- **Sin FOUC:** el script bloqueante de `next-themes` debe ejecutarse antes del primer paint. `<html suppressHydrationWarning>` es obligatorio.
- **`<meta name="color-scheme" content="light dark">`** presente en `<head>` para que el chrome del browser (scrollbars, form controls) se adapte.
- **Contraste:** todo token de color usado en texto debe cumplir WCAG AA (4.5:1) en ambos temas. Se valida en CI vía Lighthouse a11y ≥ 90.
- **Componente `ThemeToggle`** disponible globalmente y accesible vía teclado (botón nativo, `aria-label` traducido).

---

## ADDED — Capability: SEO

### Metadata API

- Todas las páginas exportan `generateMetadata` (o `metadata` estática) usando el helper `buildMetadata` de `@/lib/metadata`.
- **Campos obligatorios** por página pública:
  - `title` (sin sufijo — el template lo añade).
  - `description` (≥ 70 chars, ≤ 160 chars recomendado).
  - `alternates.canonical`.
  - `alternates.languages` con entrada por cada locale soportado + `x-default`.
  - `openGraph.{title, description, url, siteName, locale, type, images?}`.
  - `twitter.{card: 'summary_large_image', title, description}`.
- **Template global de title:** `%s | SEO Custom Tool`.

### Indexing

- Controlado por `NEXT_PUBLIC_ALLOW_INDEXING` (string `"true"` / `"false"`).
- **`false` por default** en cualquier ambiente que no sea producción.
- Cuando es `false`, `metadata.robots = { index: false, follow: false }` y `robots.txt` emite `Disallow: /`.

### robots.txt

- Servido dinámicamente desde `app/robots.ts`.
- Referencia `${NEXT_PUBLIC_SITE_URL}/sitemap.xml`.

### sitemap.xml

- Servido dinámicamente desde `app/sitemap.ts`.
- Cada entrada incluye `alternates.languages` por locale.
- Frecuencia de actualización: regenerar en cada build (estática).

### hreflang

- Inyectado vía `metadata.alternates.languages`.
- Cada locale tiene su URL completa.
- Incluye `x-default` apuntando a la URL del default locale sin prefijo.

### Structured data (JSON-LD)

- Componente `<JsonLd schema={...}>` (server-only) inyecta `<script type="application/ld+json">`.
- **Layout root** incluye `Organization` + `WebSite` schemas.
- Páginas con jerarquía visible incluyen `BreadcrumbList`.

### Open Graph e imágenes

- Cada locale puede tener su propia OG image vía `app/[locale]/opengraph-image.tsx`.
- Default: Next.js `ImageResponse` 1200x630 con el nombre del producto.
- Twitter image equivalente en `app/[locale]/twitter-image.tsx`.

### Favicons + manifest

- Set completo en `public/`: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180x180), `icon-192.png`, `icon-512.png` (ambos maskable).
- `app/manifest.ts` retorna `MetadataRoute.Manifest` con `name`, `short_name`, `theme_color` (igual a `--background` light), `background_color`, `display: 'standalone'`, `icons`.

---

## ADDED — Capability: Environment configuration

Variables nuevas validadas en `src/lib/env.ts` con `zod` (fallar al build si faltan):

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_SITE_URL` | URL absoluta | — | Origin sin slash final. Usado por metadata, sitemap, JSON-LD. |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `"true" \| "false"` | `"false"` | Habilita indexing en prod. |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `"es" \| "en"` | `"es"` | Debe coincidir con `routing.defaultLocale`. |

---

## ADDED — Capability: Public surface (demo)

- `GET /` → ES, título traducido, `ThemeToggle`, `LocaleSwitcher`.
- `GET /en` → EN, equivalente.
- `GET /robots.txt` → 200 con contenido válido según `NEXT_PUBLIC_ALLOW_INDEXING`.
- `GET /sitemap.xml` → 200 con entries localizadas.
- `GET /manifest.webmanifest` → 200.

---

## Verificación

Esta spec se considera satisfecha cuando:

- [ ] Lighthouse SEO ≥ 95 en `/` y `/en`.
- [ ] Lighthouse Accessibility ≥ 90 en `/` y `/en` con tema light y dark.
- [ ] `curl /robots.txt` y `curl /sitemap.xml` devuelven 200 con shape válido.
- [ ] `view-source:/` contiene `<html lang="es">` + `<link rel="alternate" hreflang="en" href="…">` + `<link rel="alternate" hreflang="x-default" href="…">`.
- [ ] Test e2e: cambiar tema, recargar, verificar persistencia + sin flash (screenshot first paint).
- [ ] Tests unitarios de `buildMetadata` y `routing` pasan.
