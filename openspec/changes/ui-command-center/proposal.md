# Change: ui-command-center

**Status:** proposed
**Created:** 2026-05-19
**Domain:** dashboard-web
**Spec target:** `openspec/specs/dashboard-web/spec.md` (v0.7.0 → v0.8.0)
**Supersedes:** `ui-polish` (in-progress; el lenguaje "soft mesh" se reemplaza por
"command center" — los componentes/animaciones útiles de ui-polish se reutilizan)

## Why

Post-`ui-polish` la app quedó con un lenguaje "soft mesh / Claude-like": fondo claro
con gradients, cards translúcidas, borders blandos. El feedback nuevo (refs visuales
provistas por el usuario, 2026-05-19) pide un giro hacia un **dark enterprise command
center** — denso, técnico, con tipografía display agresiva, KPI tiles industriales,
sidebar permanente con jerarquía visual, y un command bar global como eje de
interacción.

La marca **LumoSEO (paleta lime/verde) se conserva**. Solo cambia el lenguaje de
superficies y el peso visual.

## Goals

1. **Dark-first**: dark mode como modo primario y showcase. Light mode sigue
   soportado pero secundario. Fondo near-black con tinte sutil de marca (no negro
   puro, no green-tinted como hoy).
2. **Display typography**: H1/H2 de páginas usan tipografía display grande (clamp
   3-5rem) con **gradient text en la palabra-acento** (primary → accent / lime →
   lime-bright).
3. **Sidebar permanente** con: brand block, section labels uppercase tracked, ítems
   icon+label, ítem activo con fondo `primary/10` + border-left glow, collapse
   toggle, footer con avatar+rol+logout.
4. **Topbar con Command Bar inline** (no solo modal): input central con prefijo `⌘`
   y pill `ENTER`, bell de notificaciones, grid switcher de vistas, bloque usuario
   (nombre + tier + avatar con status dot).
5. **KPI tiles industriales**: rounded-2xl, border 1px sutil, fondo `card/60` con
   backdrop, icon box tintado top-left, trend pill top-right (delta + arrow,
   verde/rojo), label uppercase tracked, número 36-48px bold.
6. **Re-layout (no solo re-skin)**: dashboard principal con KPI grid 4×2, cards de
   gráfico con título uppercase + gradient en segunda palabra y subtítulo gris,
   secundarios (insights, opportunities) como rail derecho.
7. **Landing alineada**: hero con mismo lenguaje display + gradient, secciones
   reorganizadas con cards-tile, CTA con glow ring.
8. **Auth (Clerk) tematizado**: `appearance` prop de ClerkProvider mapeado a tokens
   nuevos para que login/signup encajen.

## Non-goals

- No tocar lógica de negocio (audit, scraper, gsc data, compare).
- No agregar features nuevas; solo redistribuir lo existente.
- No cambiar la paleta de marca (lime se mantiene); sí ajustar la rampa de neutros
  para soportar dark-first.
- No migrar de Tailwind ni reemplazar Shadcn.
- No tocar i18n (los textos se conservan; se ajustan solo strings de chrome nuevos
  como labels de section / placeholder del command bar).

## Scope (alto nivel)

**Tocado:**

- `src/styles/globals.css` — rampa de tokens dark redefinida, nuevas utilidades
  (`text-gradient-brand`, `bg-grid-faint`, `ring-active`), shadow tokens ajustados.
- `tailwind.config.ts` — radii bump (`2xl: 1.25rem`), fontSize `display` con clamp,
  letterSpacing tracked, animations sutiles.
- `src/components/ui/` — variantes nuevas en `card`, `button`, `badge`; nuevos
  primitives: `kpi-card`, `gradient-heading`, `section-label`, `icon-badge`,
  `trend-pill`, `command-bar` (trigger inline del CommandPalette existente).
- `src/app/[locale]/(protected)/_components/Sidebar.tsx` — rediseño completo.
- `src/app/[locale]/(protected)/_components/Topbar.tsx` — **nuevo** (extrae header
  actual de `(protected)/layout.tsx` y suma command bar + bell + grid + user pill).
- `src/app/[locale]/(protected)/layout.tsx` — composición sidebar+topbar+main.
- `src/app/[locale]/layout.tsx` — `ClerkProvider` con `appearance` tematizado.
- `src/app/[locale]/page.tsx` — landing re-layout.
- `src/app/[locale]/(auth)/{login,signup}/page.tsx` — wrapper rediseñado.
- `src/app/[locale]/(protected)/dashboard/page.tsx` — KPI grid 4×2 + cards gráfico.
- `src/app/[locale]/(protected)/audit/{page,[snapshotId]/page}.tsx` — nuevo layout.
- `src/app/[locale]/(protected)/{compare,gsc,gbp,analytics,settings,onboarding}/`
  — pages adaptadas a nuevos primitives (sin cambiar contenido informativo).
- `messages/{es,en}.json` — strings de chrome nuevos (Command bar placeholder,
  section labels, tier label, status indicators).

**No tocado:** scraper-api, audit-contract, lógica de Clerk auth flow, server
actions, supabase config, Go code.

## Forecast de PRs (auto-forecast, budget 1000 LOC)

Anticipo **3 PRs encadenados**:

| # | Slug | Contenido | LOC estimado |
|---|------|-----------|--------------|
| 1 | `ui-cc-foundation` | tokens (globals.css), tailwind config, primitives nuevos (kpi-card, gradient-heading, section-label, icon-badge, trend-pill, command-bar), variantes card/button/badge, Clerk appearance | 600-800 |
| 2 | `ui-cc-shell` | Sidebar rediseñado, Topbar nuevo, (protected)/layout, [locale]/layout con ClerkProvider tematizado, messages chrome | 400-600 |
| 3 | `ui-cc-pages` | Landing re-layout, auth wrapper, dashboard KPI grid, audit/compare/gsc/gbp/analytics/settings/onboarding adaptados | 700-1000 (puede partirse si excede) |

Total estimado: 1700-2400 LOC. Si PR-3 excede 1000, se parte en `ui-cc-pages-app`
(dashboard + audit + compare + gsc) y `ui-cc-pages-marketing` (landing + auth +
secundarias).

## Risks

- **Regresión visual masiva**: capturas before/after en `design.md` mitigan, pero
  conviene QA manual de cada ruta antes de mergear PR-3.
- **Clerk appearance**: el theming de Clerk usa su propio sistema de variables; si
  no se cubre algún subcomponente puede quedar inconsistente. Plan: variables
  `colorPrimary`, `colorBackground`, `colorText`, `borderRadius` + override CSS
  vars puntuales si hace falta.
- **Light mode**: re-equilibrio puede romper contraste. AA mínimo verificado por
  pantalla durante apply.
- **Cohabitación con `ui-polish`**: este change supersede el lenguaje visual de
  ui-polish pero reutiliza primitives ya creados (Sidebar, CommandPalette, KPI
  patterns). Al archivar este, marcar ui-polish también como archived/superseded.

## Acceptance criteria

- [ ] `pnpm build` verde en `dashboard-web`.
- [ ] Tests existentes pasan sin cambios (no se tocan tests de lógica).
- [ ] Dark mode es default visual; light mode sigue funcional sin contraste roto.
- [ ] Toda ruta protegida muestra sidebar + topbar nuevos.
- [ ] Landing y auth visualmente coherentes con el resto.
- [ ] Lighthouse a11y ≥ 95 en `/` y `/dashboard` (no regresión).
- [ ] Captures actualizados en `design.md` para landing, dashboard, audit, compare.
