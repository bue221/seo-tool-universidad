# Tasks: ui-polish

Estimated changed lines: ~400. Within review budget (500).

## Tokens y config

- [x] T1. `src/styles/globals.css`: agregar `--shadow-{sm,md,lg,glow}` vars + utility classes `.bg-mesh`, `.bg-dots`. Ajustar mesh existente.
- [x] T2. `tailwind.config.ts`: extender `keyframes` (`shimmer`, `fade-up`), `animation`, `boxShadow` (`soft`, `card`, `pop`, `glow`).

## Fonts

- [x] T3. `src/app/[locale]/layout.tsx`: cargar `Inter` variable via `next/font/google`. Aplicar a `<html>`.
- [x] T4. Configurar utilities `font-display` / agregar a `tailwind.config.ts` (`fontFamily.display`) para H1.

## Primitives

- [x] T5. `src/components/ui/card.tsx`: agregar prop `interactive` que aplica `hover:shadow-card hover:-translate-y-0.5 transition`.
- [x] T6. `src/components/ui/button.tsx`: refactor variant `default` (primary) a gradient + glow on hover.
- [x] T7. `src/components/ui/skeleton.tsx`: reemplazar `animate-pulse` por shimmer.

## Cmd+K palette

- [x] T8. Agregar `cmdk` a `package.json` dependencies.
- [x] T9. Crear `src/components/ui/command.tsx` (shadcn Command primitive: `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandSeparator`).
- [x] T10. Crear `src/components/command-palette/CommandPalette.tsx`:
  - Client component.
  - Hook `useEffect` para `cmd+k` / `ctrl+k`.
  - Items: rutas del nav + toggle theme + sign out.
  - Renderizado dentro de `<Dialog>` shadcn existente.
- [x] T11. Montar `<CommandPalette />` en `(protected)/layout.tsx`.

## Layouts

- [x] T12. `[locale]/layout.tsx`: aplicar `.bg-mesh` al body. Font display token.
- [x] T13. `(auth)/layout.tsx`: agregar `.bg-mesh .bg-dots` al wrapper; animate-in fade-in.
- [x] T14. `(protected)/layout.tsx` (Sidebar extraído a `_components/Sidebar.tsx` client):
  - Header: `border-b border-border/40 bg-background/80 backdrop-blur-xl`.
  - Sidebar: items con `data-active` + indicador bar (ver design).
  - Wrapper de main: `animate-in fade-in slide-in-from-bottom-2 duration-500`.
- [x] T15. Landing `[locale]/page.tsx`: hero con `font-display`, gradient mesh, CTA con gradient/glow, on-mount fade-up.

## Verify

- [ ] T16. `npx tsc --noEmit` verde (asumiendo Clerk + cmdk instalados).
- [ ] T17. Smoke manual:
  - `/` muestra hero con animación al cargar.
  - `/login` muestra Clerk centrado sobre mesh.
  - `/dashboard` header con blur, sidebar con item activo distinguible, Cmd+K abre palette.
- [x] T18. Actualizar `openspec/specs/dashboard-web/spec.md` con sección "UI Polish" v0.4.0.
- [ ] T19. Archivar change.

## Pendientes del usuario (post-write)

- [ ] U1. `cd dashboard-web && npm install` para que baje `cmdk`.
