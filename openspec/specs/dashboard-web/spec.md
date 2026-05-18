# Spec: dashboard-web

**Domain:** Frontend / orquestador del análisis SEO.
**Status:** ACTIVE (v0.2.0)
**History:**
- `web-foundation` (archived 2026-05-18) — introdujo i18n, theme, SEO, env, PWA básica.
- `ui-foundation` (archived 2026-05-18) — agregó Shadcn/ui (16 primitives), lucide-react, sonner, react-hook-form, cva. MODIFICÓ ThemeToggle y LocaleSwitcher a ToggleGroup.

---

## Capability: Internationalization (i18n)

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
- **Namespaces activos:** `Common`, `HomePage`, `NotFound`, `Theme`.
- **Formato de mensajes:** ICU MessageFormat (interpolación, plurales, selects, rich text con `t.rich`).
- **Origen:** archivos `messages/<locale>.json` en el root de `dashboard-web/`.

### Locale switcher

- Componente público `LocaleSwitcher` que preserva el `pathname` actual al cambiar.
- Implementado con `<ToggleGroup type="single">` + `usePathname`/`useRouter` de `@/i18n/navigation` (NO de `next/navigation`).
- Usa `useTransition` para feedback visual durante el re-render del árbol.
- Navegación con flechas izq/der entre items (Radix automático).

### Invariantes

- Toda página dentro de `app/[locale]/` **debe** invocar `setRequestLocale(locale)` antes de cualquier hook de next-intl.
- Ningún string visible al usuario puede estar hardcodeado en JSX; debe pasar por `t(...)` o `t.rich(...)`.

---

## Capability: Theme (light / dark / system)

### Modos soportados

- `light`, `dark`, `system` (default).
- `system` respeta `prefers-color-scheme` del OS.
- El usuario puede override y la elección persiste en `localStorage` (clave `theme`).

### Implementación

- Provider: `next-themes` con `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`.
- Tailwind: `darkMode: 'class'`.
- Tokens: CSS variables en `:root` (light) y `.dark` (dark), formato HSL sin función (ej. `0 0% 100%`) para componerlos con `hsl(var(--token) / <alpha>)`.

### Invariantes

- **Sin FOUC:** el script bloqueante de `next-themes` debe ejecutarse antes del primer paint. `<html suppressHydrationWarning>` es obligatorio.
- **`<meta name="color-scheme" content="light dark">`** presente en `<head>` para que el chrome del browser (scrollbars, form controls) se adapte.
- **Contraste:** todo token de color usado en texto debe cumplir WCAG AA (4.5:1) en ambos temas. Se valida en CI vía Lighthouse a11y ≥ 0.90.
- **`ThemeToggle`** implementado con `<ToggleGroup type="single">` + iconos `Sun`/`Moon`/`Monitor` de `lucide-react`. Accesible vía teclado (flechas izq/der, Enter/Space) y screen reader (`role="group"`, `data-state="on|off"`, `aria-label` traducido). Maneja hidratación con `mounted` flag.

---

## Capability: SEO

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
- **`metadataBase`** seteado al `NEXT_PUBLIC_SITE_URL` en el layout root (resuelve URLs relativas).

### Indexing

- Controlado por `NEXT_PUBLIC_ALLOW_INDEXING` (string `"true"` / `"false"`, coerced a boolean por zod).
- **`false` por default** en cualquier ambiente que no sea producción.
- Cuando es `false`: `metadata.robots = { index: false, follow: false }` y `robots.txt` emite `Disallow: /`.

### robots.txt

- Servido dinámicamente desde `app/robots.ts`.
- En modo indexing: referencia `${NEXT_PUBLIC_SITE_URL}/sitemap.xml` y declara `host`.

### sitemap.xml

- Servido dinámicamente desde `app/sitemap.ts`.
- Lista `PUBLIC_PATHS` (extensible) — hoy contiene `/`.
- Cada entrada incluye `alternates.languages` por locale.
- `lastModified` regenerado en cada build; `changeFrequency: 'weekly'`, `priority` 1.0 para `/`, 0.7 para resto.

### hreflang

- Inyectado vía `metadata.alternates.languages`.
- Cada locale tiene su URL completa.
- Incluye `x-default` apuntando a la URL del default locale sin prefijo.

### Structured data (JSON-LD)

- Componente server `<JsonLd schema={...}>` inyecta `<script type="application/ld+json">`.
- **Layout root** incluye `Organization` + `WebSite` schemas vía `buildSiteSchemas()`.
- Helper `buildBreadcrumb(items)` disponible para páginas con jerarquía.

### Open Graph e imágenes dinámicas

- Cada locale tiene su OG image vía `app/[locale]/opengraph-image.tsx` (Next.js `ImageResponse` 1200x630).
- Twitter image en `app/[locale]/twitter-image.tsx` reexporta el OG (mismo ratio).
- Texto en la imagen viene traducido del namespace `Common` por locale.

### Favicons + manifest (dinámicos)

- **Sin binarios en `public/`** — todos los iconos generados con `ImageResponse`.
- `app/icon.tsx` → 32x32 PNG (favicon).
- `app/apple-icon.tsx` → 180x180 PNG (apple-touch-icon, `purpose: maskable`).
- `app/manifest.ts` retorna `MetadataRoute.Manifest` con `name`, `short_name`, `theme_color`, `background_color`, `display: 'standalone'`, `icons` apuntando a `/icon` y `/apple-icon`.

---

## Capability: Environment configuration

Variables validadas en `src/lib/env.ts` con `zod` (fallar al build si faltan o son inválidas):

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_SITE_URL` | URL absoluta (sin trailing `/`) | — | Origin. Usado por metadata, sitemap, JSON-LD, OG. |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `"true" \| "false"` | `"false"` | Habilita indexing en prod. Coerced a boolean. |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `"es" \| "en"` | `"es"` | Debe coincidir con `routing.defaultLocale`. |

Plantilla en `.env.local.example`. Schema testeable importando `publicEnvSchema` (no expuesto público hoy — agregar export si se necesita testear).

---

## Capability: Public surface

| Endpoint | Status | Contenido |
|----------|--------|-----------|
| `GET /` | 200 | ES, demo home con header + LocaleSwitcher + ThemeToggle |
| `GET /en` | 200 | EN, equivalente |
| `GET /es` | 308 → `/` | Redirect canonical |
| `GET /<zz>` | 404 | `not-found.tsx` localizado |
| `GET /robots.txt` | 200 | Texto plano según `ALLOW_INDEXING` |
| `GET /sitemap.xml` | 200 | XML con `<url>` + `<xhtml:link>` hreflang |
| `GET /manifest.webmanifest` | 200 | JSON PWA manifest |
| `GET /icon` | 200 | PNG 32x32 |
| `GET /apple-icon` | 200 | PNG 180x180 |
| `GET /opengraph-image` | 200 | PNG 1200x630 (ES) |
| `GET /en/opengraph-image` | 200 | PNG 1200x630 (EN) |
| `GET /twitter-image` | 200 | Idem OG (ES) |
| `GET /en/twitter-image` | 200 | Idem OG (EN) |

---

## Capability: UI System (Shadcn/ui + Radix primitives)

### Filosofía

- **Componentes copy-paste, no librería**: los componentes UI viven en
  `src/components/ui/` como código del repo, no como dep externa. Cero
  lock-in versionado; refactor libre.
- **Accesibilidad por default**: primitives de overlay/menu/toggle son
  `@radix-ui/react-*` — focus management, `aria-*`, navegación por teclado y
  screen reader resueltos por la librería.

### Componentes activos

| Componente | Origen | Uso |
|------------|--------|-----|
| `Button` | Shadcn | Variantes default/destructive/outline/secondary/ghost/link, sizes default/sm/lg/icon. `asChild` via `@radix-ui/react-slot`. |
| `Input`, `Label` | Shadcn (Radix) | Inputs de texto. |
| `Card` (+ Header/Title/Description/Content/Footer) | Shadcn | Contenedor visual. |
| `Badge` | Shadcn | Variantes default/secondary/outline/destructive. |
| `Tooltip` | Shadcn (Radix) | Hover/focus info. Requiere `<TooltipProvider>` en el árbol. |
| `Toggle`, `ToggleGroup` | Shadcn (Radix) | Selección segmentada. Usado por ThemeToggle y LocaleSwitcher. |
| `DropdownMenu` | Shadcn (Radix) | Menús flotantes con sub-menús, checkboxes, radios. |
| `Dialog`, `Sheet` | Shadcn (Radix) | Modales y drawers (sides top/right/bottom/left). |
| `Tabs` | Shadcn (Radix) | Navegación tabbed. |
| `Separator` | Shadcn (Radix) | Divisores horizontales/verticales. |
| `Skeleton` | Shadcn | Loading states (`animate-pulse`). |
| `Form` (+ subcomponents) | Shadcn | Bridge a `react-hook-form` + `zodResolver`. `FormField` + `FormItem` + `FormLabel` + `FormControl` + `FormDescription` + `FormMessage`. |
| `Toaster` (sonner) | Shadcn + Sonner | Notificaciones con stack management. Tema sincronizado con `next-themes`. |

### Configuración

- `components.json` en root de `dashboard-web/`:
  - `style: "default"`, `baseColor: "neutral"`, `cssVariables: true`.
  - `iconLibrary: "lucide"`.
  - Aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
- `src/lib/utils.ts` exporta `cn(...inputs)` = `twMerge(clsx(...inputs))`.
- `tailwindcss-animate` plugin habilitado en `tailwind.config.ts`.

### Tokens CSS adicionales

| Token | Uso |
|-------|-----|
| `--card`, `--card-foreground` | Fondo de `Card`. |
| `--popover`, `--popover-foreground` | Fondo de `Tooltip`, `DropdownMenu`. |
| `--secondary`, `--secondary-foreground` | Variant `secondary` de Button/Badge. |
| `--accent`, `--accent-foreground` | Hover de menus y toggles activos. |
| `--destructive`, `--destructive-foreground` | Variant `destructive` + errores de Form. |
| `--input` | Border de inputs. |
| `--ring` | Focus ring de elementos interactivos. |
| `--radius` | `0.5rem` — base para `lg/md/sm` rounded utilities. |

### Iconos

- Librería: **`lucide-react`**.
- Tree-shaking activo: `import { Sun } from 'lucide-react'` produce bundle
  mínimo.
- **Invariante:** prohibido SVG inline en componentes nuevos — usar lucide
  o crear archivo dedicado en `src/components/icons/`.

### Toaster

- Una instancia montada en `app/[locale]/layout.tsx` (paralela a los providers).
- `theme` heredado de `next-themes` (light/dark/system → toasts coinciden).
- Posición por default: `bottom-right`.
- Disparar toasts: `import { toast } from 'sonner'; toast('msg')`.

### Forms

- Stack obligatorio: **`react-hook-form` + `zodResolver`** vía componente `Form`.
- Schemas zod viven cerca del componente que los usa.
- `FormField` retorna props compatibles con cualquier input controlado
  (`Input`, `Select`, `Checkbox`, etc.).

### Invariantes nuevas (ui-foundation)

1. **No reescribir primitives** (`Button`, `Input`, etc.) por feature — usar
   los de `@/components/ui/`. Variantes nuevas via `cva`, no clonar.
2. **Iconos via `lucide-react`** — no inline SVG.
3. **Toasts via `sonner`** — no escribir sistema de notificaciones ad-hoc.
4. **Forms con `react-hook-form` + `zod`** — no `useState` manual para inputs
   controlados en formularios.
5. **Estilos con `cn()`** — para componer clases condicionales y resolver
   conflictos Tailwind. Nunca concatenar strings de clases a mano.

### Layout

- `<TooltipProvider delayDuration={200}>` envuelve `{children}` dentro de
  `NextIntlClientProvider`. Sin esto, cualquier `<Tooltip>` lanza warning.
- `<Toaster />` se monta **paralelo** a los providers (dentro de
  `ThemeProvider` pero fuera de `NextIntlClientProvider` y `TooltipProvider`)
  para que los portals no estén anidados innecesariamente.

---

## Verificación

Spec satisfecha cuando ✓:

- [ ] `pnpm test` pasa con tests en `src/lib/metadata.test.ts`, `src/i18n/routing.test.ts` y `src/lib/utils.test.ts`.
- [ ] `pnpm build` compila sin error (incluye validación zod del env). First-load JS de `/` ≤ 220KB.
- [ ] Smoke checklist completo en [`dashboard-web/SMOKE.md`](../../../dashboard-web/SMOKE.md) pasa secciones 1–5 (incluye 4.1 a11y de toggles y 4.2 UI primitives).
- [ ] `pnpm lighthouse` cumple thresholds (SEO ≥ 0.95, a11y ≥ 0.90) en `/` y `/en`.
- [ ] Toggles migrados navegables con flechas izq/der. VoiceOver anuncia estado correctamente.

---

## Histórico de cambios

| Versión | Fecha       | Cambio | Source |
|---------|-------------|--------|--------|
| v0.1.0  | 2026-05-18  | Spec inicial. ADDED i18n, Theme, SEO, Env config, Public surface. | [`changes/archive/web-foundation/`](../../changes/archive/web-foundation/) |
| v0.2.0  | 2026-05-18  | ADDED UI System (Shadcn + 16 primitives, lucide, sonner, forms). MODIFIED ThemeToggle y LocaleSwitcher → ToggleGroup. | [`changes/archive/ui-foundation/`](../../changes/archive/ui-foundation/) |
