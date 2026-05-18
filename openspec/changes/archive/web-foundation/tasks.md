# Tasks: web-foundation

> Marcar con `[x]` al completar. Las secciones tienen orden de dependencia; dentro de cada sección los items pueden ir en paralelo.

---

## 0. Bootstrap del proyecto Next.js

- [x] ~~Inicializar Next.js en `dashboard-web/` con App Router + TS + Tailwind + ESLint + import alias `@/*`.~~
  > **Pivote ejecutado (2026-05-18):** la red corporativa del usuario bloquea el
  > registry público (DNS no resuelve) y Fury devuelve 403 para los paquetes
  > requeridos. En lugar de correr `pnpm create next-app`, se hizo **scaffold
  > offline a mano**: `package.json`, `tsconfig.json`, `next.config.mjs`,
  > `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `.gitignore`,
  > `.npmrc` (apunta a registry público), `next-env.d.ts`, `src/app/layout.tsx`,
  > `src/app/page.tsx`, `src/styles/globals.css`. Falta solo `pnpm install`
  > cuando la red esté arreglada.
- [ ] Confirmar que `pnpm dev` levanta y `pnpm build` pasa antes de tocar nada más. *(requiere `pnpm install` previo)*
- [ ] Instalar dependencias core: `pnpm add next-intl next-themes zod`.
- [ ] Instalar dev deps: `pnpm add -D @types/node vitest @lhci/cli`.

## 1. i18n (next-intl)

- [x] Crear `src/i18n/routing.ts` con `defineRouting({ locales: ['es','en'], defaultLocale: 'es', localePrefix: 'as-needed' })`.
- [x] Crear `src/i18n/request.ts` con `getRequestConfig` cargando `messages/${locale}.json`.
- [x] Crear `src/i18n/navigation.ts` exportando `Link`, `redirect`, `usePathname`, `useRouter` de `createNavigation(routing)`.
- [x] Crear `src/middleware.ts` con `createMiddleware(routing)` y matcher que excluya `api`, `_next`, `_vercel`, archivos con `.`.
- [x] Crear `messages/es.json` y `messages/en.json` con namespaces mínimos: `Common`, `HomePage` (+ `NotFound` como extra).
- [x] Wrap `next.config.mjs` con `createNextIntlPlugin('./src/i18n/request.ts')`.
- [x] Mover `app/layout.tsx` y `app/page.tsx` a `app/[locale]/`.
- [x] En `app/[locale]/layout.tsx`: validar `locale` con `hasLocale`, llamar `setRequestLocale(locale)`, `generateStaticParams`, `NextIntlClientProvider` con `getMessages`.
- [x] **Extra:** `app/[locale]/not-found.tsx` con copies localizadas.
- [ ] Smoke: `/` muestra ES, `/en` muestra EN, `/zz` → 404. *(bloqueado por `pnpm install` pendiente)*

## 2. Theme (next-themes)

- [x] Crear `src/components/theme/ThemeProvider.tsx` (client component, wrap de `next-themes/ThemeProvider`).
- [x] En `app/[locale]/layout.tsx`:
  - [x] `suppressHydrationWarning` en `<html>` (hecho en sección 1).
  - [x] Envolver children: `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>` (extra: `disableTransitionOnChange` para evitar barrido de transitions).
  - [x] `<meta name="color-scheme" content="light dark" />` (hecho en sección 1).
- [x] Configurar Tailwind: `darkMode: 'class'` (hecho en sección 0).
- [x] Definir CSS variables en `src/styles/globals.css` para `:root` y `.dark` (hecho en sección 0).
- [x] Extender Tailwind theme con `colors.background = 'hsl(var(--background))'` etc (hecho en sección 0).
- [x] Crear `src/components/theme/ThemeToggle.tsx` (botón segmentado con 3 estados: light / dark / system, accesible, sin lucide-react).
- [x] **Extra:** namespace `Theme` en es/en + integración del toggle en `app/[locale]/page.tsx`.
- [ ] Smoke: togglear, recargar, verificar persistencia y ausencia de flash. *(bloqueado por `pnpm install` pendiente)*

## 3. SEO

### 3.1 Metadata API

- [x] Crear `src/lib/env.ts` con validación zod de `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ALLOW_INDEXING`, `NEXT_PUBLIC_DEFAULT_LOCALE`.
- [x] Crear `src/lib/metadata.ts` con `buildMetadata({ locale, path, title, description, ogImage? })` + helper `localizedUrl`.
- [x] Implementar metadata estática global en `app/[locale]/layout.tsx` (title.template, metadataBase, applicationName, authors, robots condicional).
- [x] Implementar `generateMetadata` en `app/[locale]/page.tsx` con overrides de title/description vía buildMetadata.

### 3.2 robots + sitemap

- [x] Crear `app/robots.ts` con `MetadataRoute.Robots`:
  - Si `NEXT_PUBLIC_ALLOW_INDEXING !== true` → `disallow: '/'`.
  - Else → `allow: '/'`, sitemap ref + host.
- [x] Crear `app/sitemap.ts` con `MetadataRoute.Sitemap`:
  - PUBLIC_PATHS extensible.
  - Cada entrada con `alternates.languages` por locale.

### 3.3 Open Graph + Twitter

- [x] Cubierto por `buildMetadata` (sección 3.1).
- [x] `app/[locale]/opengraph-image.tsx` — `ImageResponse` 1200x630 con copy traducido por locale.
- [x] `app/[locale]/twitter-image.tsx` — re-export de opengraph-image (mismo ratio).

### 3.4 JSON-LD

- [x] Crear `src/components/seo/JsonLd.tsx` (server component + `buildSiteSchemas` + `buildBreadcrumb` helper).
- [x] En `app/[locale]/layout.tsx`: incluir schemas `Organization` + `WebSite` en `<head>`.

### 3.5 Iconos y manifest

- [x] **Pivote vs plan**: en vez de generar set de PNGs binarios (que sin red no puedo), uso `app/icon.tsx` y `app/apple-icon.tsx` con `ImageResponse` — Next.js los compila a PNG en build. Cero binarios.
- [x] Crear `app/manifest.ts` con name, short_name, theme_color, icons, display `standalone`.

### 3.6 Documentación

- [x] **Extra:** `.env.local.example` para copy-paste.
- [x] **Extra:** README actualizado con estado por sección.

## 4. Página de demo

- [x] `app/[locale]/page.tsx`: header con `LocaleSwitcher` + `ThemeToggle`, H1 traducido, párrafo con `t.rich`, CTAs, grid de stats (locale/default/prefix/locales), footer.
- [x] Crear `src/components/i18n/LocaleSwitcher.tsx` con `usePathname`/`useRouter` de `@/i18n/navigation` (segmentado, `useTransition` para feedback visual).
- [x] **Extra:** migré `dangerouslySetInnerHTML` a `t.rich({ code: chunks => <code>{chunks}</code> })` — patrón canónico de next-intl, más seguro y type-safe.

## 5. Tests y verificación

- [x] Setup `vitest.config.ts` con alias `@/*` y env vars de test pre-seteadas.
- [x] Test unit (`src/lib/metadata.test.ts`): 14 specs cubriendo `localizedUrl` + `buildMetadata` (hreflang completo, x-default, OG/Twitter shape, robots condicional, ogImage override).
- [x] Test unit (`src/i18n/routing.test.ts`): default locale, locales soportados, localePrefix.
- [x] `.lighthouserc.json` con thresholds SEO ≥ 0.95 (error), a11y ≥ 0.90 (error), best-practices/perf como warnings.
- [x] Script `pnpm lighthouse` agregado.
- [x] **Smoke checklist** completo en `dashboard-web/SMOKE.md` (7 secciones, comandos copy-paste).
- [ ] **Ejecutar** los tests, build y Lighthouse. *(bloqueado por `pnpm install` pendiente)*

## 6. Documentación

- [x] Actualizar `dashboard-web/README.md` con quickstart real, scripts table, estructura completa, sección "cómo..." (cookbook con 4 recetas), limitaciones conocidas.
- [x] Anotar en `dashboard-web/agents.md` la "Foundation Layer" como capacidad activa con tabla de capacidades, invariantes que la capa garantiza, y roadmap de changes futuros.
- [x] Agregar entrada en `openspec/specs/dashboard-web/spec.md` cuando se archive este change. *(hecho en sección 7)*

## 7. Cierre

- [ ] PR en `main` con título: `feat(web): SEO + i18n + theme foundation [web-foundation]`. *(bloqueado por git + red — body listo en `PR_DRAFT.md`)*
- [ ] Validar specs: `openspec validate web-foundation`. *(bloqueado por CLI no instalado; review manual del delta hecho)*
- [x] **Archive equivalente offline:** delta promovido a [`openspec/specs/dashboard-web/spec.md`](../../../specs/dashboard-web/spec.md). Change movido a [`openspec/changes/archive/web-foundation/`](.). Banner ARCHIVED en el delta.
- [x] **Documentación raíz actualizada:** `openspec/README.md` lista spec activa + este archive; `AGENTS.md` raíz tiene tabla de specs + roadmap de changes futuros.
- [ ] Notificar al equipo. *(no aplica — proyecto académico individual)*
