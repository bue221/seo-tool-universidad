# Proposal: ui-foundation

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-18
**Depends on:** [`web-foundation`](../archive/web-foundation/) (archived) — necesita tokens HSL en `:root`/`.dark` y Tailwind `darkMode: 'class'`.

---

## ¿Por qué?

`web-foundation` dejó la app con tokens de tema funcionando pero **sin librería de componentes**. Cada `ThemeToggle` y `LocaleSwitcher` que escribimos tiene SVG inline, estilos repetidos a mano, y zero accesibilidad profunda (focus rings, aria-haspopup, etc.). Construir el resto del producto sobre esa base implica:

- **Re-inventar primitives** que Shadcn ya resuelve: `Button` (5 variantes), `Input`, `Card`, `DropdownMenu`, `Dialog`, `Tooltip`, `Toast`, `Skeleton`...
- **Inconsistencia visual** entre features futuras — cada dev (o cada sesión nuestra) elegirá padding/radius/transitions distintos.
- **Accesibilidad mediocre** — los radix-ui primitives manejan focus trap, `aria-*`, navegación con teclado, screen reader announcements. Reimplementarlo a mano es un sumidero.
- **Migración cara después** — meter Shadcn cuando ya hay 20 componentes custom requiere refactorizar todo. Hoy hay 2 (Toggle + Switcher), barato migrar.

Por eso `ui-foundation` es el **siguiente change crítico** antes de tocar product features.

## ¿Qué?

### Alcance (in-scope)

1. **Setup de Shadcn/ui** "manual offline-friendly":
   - `components.json` con `style: "default"`, `baseColor: "neutral"`, `cssVariables: true`, `iconLibrary: "lucide"`.
   - `src/lib/utils.ts` con helper `cn` (clsx + tailwind-merge).
   - Extender `tailwind.config.ts` con keyframes/animations de Shadcn + plugin `tailwindcss-animate`.
   - Extender `src/styles/globals.css` con los tokens Shadcn faltantes: `--card`, `--popover`, `--accent`, `--destructive`, `--ring`, `--input`, `--radius`.

2. **Componentes UI base (paleta mínima)**:
   - `Button` — variantes `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
   - `Input` + `Label` (compatible con `<Form>` futuro).
   - `Card` + `CardHeader/Title/Description/Content/Footer`.
   - `Badge` — variantes `default`, `secondary`, `outline`, `destructive`.
   - `Tooltip` (`@radix-ui/react-tooltip`).
   - `Toggle` + `ToggleGroup` (`@radix-ui/react-toggle-group`) — para reemplazar `ThemeToggle` y `LocaleSwitcher`.
   - `DropdownMenu` (`@radix-ui/react-dropdown-menu`) — para menús futuros (user, locale alternative, etc.).
   - `Skeleton` — loading states.
   - `Separator`, `Tabs`, `Sheet`, `Dialog` (`@radix-ui/react-*`) — primitives base para layouts y modales.
   - `Sonner` toaster integrado con `next-themes` (modo light/dark automático).

3. **Migración de componentes existentes**:
   - `ThemeToggle` → `ToggleGroup` con iconos `lucide-react` (`Sun`, `Moon`, `Monitor`). Elimina los 3 SVG inline.
   - `LocaleSwitcher` → `ToggleGroup` con texto. Misma API pública.

4. **Form support básico**:
   - `react-hook-form` + `@hookform/resolvers/zod` instalados.
   - `Form` component de Shadcn copiado (`FormField`, `FormLabel`, `FormControl`, `FormMessage`).
   - **No** crea formularios reales — eso es de `auth-foundation` y features.

### No-objetivos (out-of-scope)

- **No** se construye ningún componente "compuesto" de producto (NavBar, Sidebar, Header, etc.). Eso vive en features.
- **No** se mete `DataTable` (lo necesita `analytics-dashboard`).
- **No** se mete `Calendar`/`DatePicker` (feature-specific).
- **No** se mete `Charts` (Recharts pertenece a `analytics-dashboard`).
- **No** se migra Tailwind a v4 — sigue 3.4 hasta que Shadcn lo soporte completo.
- **No** se cambia el `style` a `new-york` o `radix-nova` — `default` es lo más universal hoy.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Shadcn CLI requiere red (no se puede correr `npx shadcn add button`) | Pivote offline (mismo patrón que `web-foundation`): copio el código de cada componente desde la doc oficial a mano. Cuando haya red, el CLI puede `add` componentes nuevos sin tocar los existentes. |
| Conflicto de tokens entre los míos de `web-foundation` (`--background`, `--foreground`, `--primary`, `--muted`, `--border`) y los nuevos de Shadcn | Voy a **expandir** los existentes (mantener mismos nombres y agregar los faltantes). Cero breaking changes. |
| Migrar `ThemeToggle`/`LocaleSwitcher` a `ToggleGroup` cambia el árbol de DOM y puede romper a11y existente | Pruebas manuales con keyboard + VoiceOver post-migración. `ToggleGroup` es **más accesible** que mi implementación (focus management automático). |
| `lucide-react` agrega ~150KB sin tree-shaking | Tree-shaking funciona out-of-the-box con `import { Sun } from 'lucide-react'` cuando el bundler es moderno. Verificar en `pnpm build`. |
| `tailwindcss-animate` plugin requiere agregar al config | Trivial — un `plugins: [require('tailwindcss-animate')]`. |
| Sonner vs Toast custom — divergencia de versiones | Voy con `sonner` (lo que Shadcn recomienda hoy). Maneja stacking, dismiss, action button, e integra con `next-themes`. |

## Métricas de éxito

- **Visual:** `/` y `/en` se ven idénticos al estado actual de `web-foundation` (los `ToggleGroup` reemplazan los `<div role="group">` sin cambio visible).
- **A11y:** Lighthouse a11y ≥ 0.90 sigue cumpliendo en ambos temas.
- **Bundle:** `pnpm build` reporta first-load JS ≤ 220KB para `/` (baseline `web-foundation` + Radix primitives mínimos).
- **DX:** crear una nueva página con form + button + card + toast toma < 5 min copy-paste desde docs.
- **Lockfile estable:** las versiones de `@radix-ui/react-*` resueltas son todas v1.x latest, sin major mismatches.

## Referencias

- Spec previa: [`openspec/specs/dashboard-web/spec.md`](../../specs/dashboard-web/spec.md) — el delta de este change la MODIFY+ADDS.
- Docs Shadcn: https://ui.shadcn.com/docs/components
- Radix UI primitives: https://www.radix-ui.com/primitives
