# Spec: dashboard-web

**Domain:** Frontend / orquestador del análisis SEO.
**Status:** ACTIVE (v0.4.0)
**History:**
- `web-foundation` (archived 2026-05-18) — introdujo i18n, theme, SEO, env, PWA básica.
- `ui-foundation` (archived 2026-05-18) — agregó Shadcn/ui (16 primitives), lucide-react, sonner, react-hook-form, cva. MODIFICÓ ThemeToggle y LocaleSwitcher a ToggleGroup.
- `auth-clerk-migration` (in-progress 2026-05-19) — ADDED auth con Clerk + Supabase como third-party. REMOVED server actions de Supabase Auth (sign-in/up, forgot/reset). MODIFIED paleta a Lime.
- `ui-polish` (in-progress 2026-05-19) — ADDED shadow tokens, bg-mesh/bg-dots utilities, shimmer skeleton, Cmd+K palette, sidebar active indicator, hero on-mount animations, Inter display font. MODIFIED Card (`interactive`), Button (gradient + glow).

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
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_...` | — | Clerk publishable key, inyectada al cliente. |
| `CLERK_SECRET_KEY` | `sk_...` | — | Clerk secret, server-only. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | path absoluto | `/es/login` | Redirect target cuando falta sesión. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | path absoluto | `/es/signup` | Redirect target para registro. |

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

## Capability: Authentication (Clerk + Supabase third-party)

### Stack

- **Clerk** (`@clerk/nextjs`) es el proveedor de identidad: maneja sign-in, sign-up,
  password reset, MFA y OAuth providers (Google, Microsoft, GitHub, etc.) configurados
  desde Clerk dashboard → Social Connections.
- **Supabase** acepta el JWT de Clerk vía la integración oficial third-party
  (no la deprecada de JWT templates). El claim `role: "authenticated"` se setea
  en Clerk session tokens; Supabase lo lee para aplicar RLS.
- Dev local: `supabase/config.toml` declara `[auth.third_party.clerk]` con el dominio
  de Clerk.

### Componentes

| Ruta | Componente | Notas |
|------|-----------|-------|
| `/{locale}/login(.*)` | `<SignIn />` de Clerk | `routing="path"` para sub-paths internos. |
| `/{locale}/signup(.*)` | `<SignUp />` de Clerk | idem. |
| `(protected)/*` | `auth.protect()` en middleware | Redirige a `NEXT_PUBLIC_CLERK_SIGN_IN_URL` si no hay sesión. |

### Helpers

- `getCurrentUser()` en `src/lib/auth.ts` combina `auth()` + `currentUser()` de Clerk
  con `profiles.display_name` desde Supabase. Retorna `{ id, email, displayName }`.
  `id` es Clerk user id (`user_xxx`, **no UUID**).
- `createClient()` en `src/lib/supabase/server.ts` usa `@supabase/supabase-js` plano
  con `accessToken: () => auth().getToken()`.
- `useSupabase()` hook en `src/lib/supabase/browser.ts` para Client Components.

### Middleware

```ts
clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
  return intlMiddleware(req);
});
```

Orden: Clerk primero (protección), luego next-intl (rewrite por locale).

### Sign-out

- UI: `<SignOutButton redirectUrl="/{locale}/login">` dentro de `UserMenu`.
- Sin server action propia (la antigua queda como stub vacío para retrocompat).

### Migration notes

- `profiles.user_id` debe ser `text` (no `uuid`) para aceptar Clerk IDs.
- RLS policies deben usar `auth.jwt() ->> 'sub'` (no `auth.uid()`) para identificar al user.
- No quedan dependencias de `@supabase/ssr` en runtime (sigue como dep transitiva).

### Invariantes

1. Nuevas server actions que querean Supabase **deben** usar `createClient()` de
   `@/lib/supabase/server` para que el JWT Clerk viaje.
2. Client components que querean Supabase **deben** usar `useSupabase()` y manejar
   `null` mientras la sesión Clerk no está cargada.
3. **Prohibido** llamar `supabase.auth.signIn*` / `signUp` / `getUser` — esos métodos
   referencian Supabase Auth, que ya no se usa.

---

## Capability: UI Polish (visual layer)

### Shadow tokens

CSS variables en `globals.css`, expuestas como utilities Tailwind:

| Token | Utility | Uso |
|-------|---------|-----|
| `--shadow-soft` | `shadow-soft` | Cards estáticas, inputs, sidebar. |
| `--shadow-card` | `shadow-card` | Cards en hover, popovers nivel 1. |
| `--shadow-pop`  | `shadow-pop`  | Dialogs, command palette, modales. |
| `--shadow-glow` | `shadow-glow` | Primary CTA en hover/focus (tinte primary). |

Valores escalan automáticamente con light/dark (en dark suben opacidad).

### Background utilities

- `.bg-mesh` — tres radiales lime/accent. Usar en hero/CTAs/auth wrapper.
- `.bg-dots` — dot grid `24x24`. SOLO marketing/hero. Distrae en app shell.
- `body` ya tiene mesh base con `background-attachment: fixed`.

### Animations

Keyframes custom (sumadas a `tailwindcss-animate`):

| Animation | Uso |
|-----------|-----|
| `animate-shimmer` | Skeleton sweep (1.6s linear infinite). |
| `animate-glow-pulse` | CTA pulsante — usar con MUCHA moderación. |
| `animate-in fade-in slide-in-from-bottom-*` | Page on-mount (CSS de tailwindcss-animate). |

**Invariante:** prohibido scroll-reveal (AOS, framer scroll triggers) en rutas `(protected)`.
On-mount fade-up `≤ 500ms` está permitido y se recomienda.

### Typography

- Inter variable via `next/font/google` (self-hosted, sin runtime request).
- CSS var `--font-sans` referenciada desde `fontFamily.sans` y `fontFamily.display`.
- Utility `.text-display` aplica `letter-spacing: -0.025em; line-height: 1.05;` + ligaduras.
  Usar en H1/H2 de landing y headings prominentes.

### Primitives modificadas

- **Card**: nueva prop `interactive`. Aplica `hover:-translate-y-0.5 hover:shadow-card`.
  Base ahora usa `border-border/60 bg-card/80 shadow-soft backdrop-blur-sm`.
- **Button** variant `default`: gradient `from-primary to-primary/85`, sombra soft → glow on hover.
  `active:scale-[0.98]` para feedback táctil. `transition-all` (no solo colors).
- **Skeleton**: shimmer via `::before` pseudo + `animate-shimmer`. Reemplaza `animate-pulse`.

### Command Palette (Cmd+K)

- Componente `<CommandPalette>` en `src/components/command-palette/`.
- Primitives base: `src/components/ui/command.tsx` (wrapper de `cmdk`).
- Montado en `(protected)/layout.tsx` — NO disponible en landing/auth.
- Hotkey: `event.metaKey || event.ctrlKey` + `k`.
- Acciones: navegación (NAV_ITEMS), theme switch, sign out (Clerk).
- Dialog con `bg-popover/95 backdrop-blur-xl shadow-pop`.

### App shell

- **Header**: `border-b border-border/40 bg-background/70 backdrop-blur-xl`.
  Hint visual `⌘K` en badge `<kbd>` (sm+).
- **Sidebar** (`Sidebar.tsx` client): items con `data-active` derivado de `usePathname()`.
  Active styles: tint `bg-accent/20`, barra acentuada izquierda (opacity transition 200ms),
  icono en `text-primary`. **No** sliding pill (limitación CSS-only documentada).
- **Main**: `animate-in fade-in slide-in-from-bottom-2 duration-500` on mount.

### Invariantes nuevas (ui-polish)

1. Cards interactivas (que linkean o disparan acción) **deben** usar `<Card interactive>`.
   Cards puramente informativas NO usan `interactive` (hover sin feedback confunde).
2. Sombras **solo** vía utilities `shadow-{soft,card,pop,glow}`. Prohibido
   `shadow-sm/md/lg/xl` (Tailwind defaults) y `style={{ boxShadow }}` inline.
3. `.bg-dots` reservado para marketing/landing. Nunca en app shell interno.
4. H1/H2 de landing usan `.text-display`. H1 de app shell pueden omitirlo (más funcional).
5. Animaciones on-mount limitadas a 500ms. Scroll-reveal prohibido en `(protected)`.

---

## Histórico de cambios

| Versión | Fecha       | Cambio | Source |
|---------|-------------|--------|--------|
| v0.1.0  | 2026-05-18  | Spec inicial. ADDED i18n, Theme, SEO, Env config, Public surface. | [`changes/archive/web-foundation/`](../../changes/archive/web-foundation/) |
| v0.2.0  | 2026-05-18  | ADDED UI System (Shadcn + 16 primitives, lucide, sonner, forms). MODIFIED ThemeToggle y LocaleSwitcher → ToggleGroup. | [`changes/archive/ui-foundation/`](../../changes/archive/ui-foundation/) |
| v0.3.0  | 2026-05-19  | ADDED Authentication (Clerk + Supabase third-party). REMOVED server actions Supabase Auth. MODIFIED paleta tokens a Lime. | [`changes/auth-clerk-migration/`](../../changes/auth-clerk-migration/) |
| v0.4.0  | 2026-05-19  | ADDED shadow tokens, mesh/dots utilities, shimmer, Cmd+K palette, sidebar active indicator, Inter display font, on-mount animations. MODIFIED Card (`interactive`), Button (gradient/glow), Skeleton (shimmer). | [`changes/ui-polish/`](../../changes/ui-polish/) |
| v0.5.0  | 2026-05-19  | ADDED WooRank tab en `/audit/[snapshotId]`: `WoorankSection` con score ring SVG + 16 chequeos agrupados por categoría. Render condicional cuando `scraper.woorank` está presente. Zod schema extendido (campo opcional). i18n `Audit.Result.Woorank`. | [`changes/archive/woorank-checker/`](../../changes/archive/woorank-checker/) |
| v0.6.0  | 2026-05-19  | ADDED sección Search Console simulada en `/gsc/*` con 5 rutas (landing + overview/queries/pages/devices/countries por propiedad). Generador determinista `src/lib/gsc/*` (PRNG mulberry32 + SHA-256 seed) sin tablas nuevas — propiedades derivadas de `seo_snapshots`. SVG puro para time series y donut (cero deps de chart). i18n `GSC.*`. Sidebar nav extendida con "Search Console". | [`changes/archive/gsc-simulator/`](../../changes/archive/gsc-simulator/) |
| v0.7.0  | 2026-05-19  | ADDED `/compare` (3 tabs: tabla con heatmap, radar SVG, keyword gap). Server action `runComparison` corre hasta 4 audits en paralelo con timeout 30s c/u, sin persistencia. Refactor: extraído `src/lib/audit/run.ts` reusado por `run-audit` y `run-comparison`. Sidebar nav extendida con "Compare". i18n `Compare.*`. | [`changes/archive/competitor-compare/`](../../changes/archive/competitor-compare/) |
