# Change: ui-polish

**Status:** in-progress
**Created:** 2026-05-19
**Domain:** dashboard-web
**Spec target:** `openspec/specs/dashboard-web/spec.md` (v0.3.0 → v0.4.0)

## Why

La UI actual (post `ui-foundation`) usa Shadcn neutral con borders duros, sin animaciones,
sin profundidad y con tipografía sistema plana. El feedback fue: "como Claude / OpenAI" —
es decir, **app shell denso pero respirado** y **landing con presencia**.

Referencia visual (anthropic.com, claude.ai, openai.com):

- Fondo con gradient mesh suave (no plano).
- Cards con `backdrop-blur` y sombra difusa, border casi invisible.
- Hover-lift en elementos interactivos.
- Micro-animaciones en mount (fade + slide ≤ 8px, 300-400ms).
- Tipografía display para H1.
- Cmd+K palette para navegación rápida.
- Skeletons con shimmer (no pulse plano).
- Botones primary con gradient + glow on hover.
- Background texturado (dot grid sutil).

## What

Polish transversal aplicado en dos superficies:

### Landing / public (`/`, `/login`, `/signup`)
- Hero con tipografía display, gradient mesh de fondo, fade-up on mount.
- Botones CTA con gradient + hover glow.

### App shell (`(protected)/layout.tsx`)
- Header con `backdrop-blur` y border `border/40`.
- Sidebar con active-indicator animado (background tint + left accent bar, transición 200ms).
- Cards convertidas a variante "interactive" con hover-lift.
- Cmd+K palette global navega entre rutas del side nav.
- Page on-mount: fade-in + slide-up 8px (`animate-in` de `tailwindcss-animate`).

### Primitives tocadas
- `Card`: nueva variante `interactive` (hover-lift + shadow ramp).
- `Button`: variant `primary` con gradient sutil + glow on focus/hover.
- `Skeleton`: shimmer (gradient sweep 1.5s) en lugar de `animate-pulse`.
- Nuevo: `Command` (shadcn primitive vía `cmdk`) + `CommandPalette` global.

### Background/global
- `globals.css`: gradient mesh radial + dot-grid noise utility class.
- `tailwind.config.ts`: keyframes `shimmer`, `glow`, `lift` + utilities.

## In scope

- Estilos transversales: globals, tailwind config.
- Layouts: `[locale]/layout.tsx`, `(auth)/layout.tsx`, `(protected)/layout.tsx`.
- Landing `[locale]/page.tsx`.
- Primitives: Card, Button, Skeleton.
- Nuevo: `components/ui/command.tsx` + `components/command-palette/CommandPalette.tsx`.
- Tipografía display: `next/font` con Inter (variable) + tracking ajustado para H1.

## Out of scope

- No tocamos páginas individuales del `(protected)` salvo header/sidebar/cards heredados.
- No refactor de queries ni server actions.
- No framer-motion. Si en otra iteración se quiere indicador sidebar "Linear-style"
  con sliding real, va en un change separado.
- No nuevos componentes funcionales (charts, tables, etc.).
- No cambios de paleta — Lime se mantiene.

## Acceptance criteria

1. Landing `/` y `/en`: hero con display font, fade-up al mount, CTA con gradient + glow.
2. `(auth)` páginas: fondo con gradient mesh; Clerk components centrados sobre él.
3. `(protected)` header: `backdrop-blur` activo, sin border duro.
4. `(protected)` sidebar: item activo distinguible con tint + barra izquierda, transición 200ms al navegar.
5. Cards en `dashboard`/`audit`/etc. con `border/40`, sombra suave, hover-lift donde corresponde.
6. `Cmd+K` (o `Ctrl+K`) abre palette con las rutas del nav. Esc cierra. Enter navega.
7. Skeletons muestran shimmer, no pulse.
8. `npx tsc --noEmit` sigue verde (asumiendo Clerk instalado).
9. Bundle JS no crece más de +25KB gzipped (cmdk pesa ~8KB; resto es CSS).

## Risks

| Risk | Mitigación |
|------|-----------|
| `backdrop-blur` en Safari < 14 falla | Fallback: `bg-card/80` sin blur; visualmente aceptable. |
| Gradient mesh roto en SSR (cliente diferente) | Usar `backgroundImage` en CSS, no inline style. |
| Cmd+K en Mac vs Win/Linux | Detectar `navigator.platform` y mostrar ⌘ vs Ctrl en hint. |
| `cmdk` no instalado todavía | Declarar dep en `package.json`, dejar al user el `npm install` (mismo patrón que Clerk). |
