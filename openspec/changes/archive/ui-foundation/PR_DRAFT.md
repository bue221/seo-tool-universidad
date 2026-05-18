# PR Draft — ui-foundation

> Listo para copy-paste cuando `git init` + push + creación de PR estén disponibles.

## Título

```
feat(web): Shadcn/ui foundation [ui-foundation]
```

## Body

```markdown
## Summary

- UI System sobre `dashboard-web`: 16 primitives Shadcn/ui (Button, Input, Label, Card, Badge, Separator, Skeleton, Tabs, Dialog, Sheet, Tooltip, DropdownMenu, Toggle, ToggleGroup, Sonner Toaster, Form) sobre `@radix-ui/react-*`.
- `lucide-react` para iconos (tree-shakeable), `sonner` para toasts (sincronizado con `next-themes`), `react-hook-form` + `@hookform/resolvers/zod` para formularios.
- Migración: `ThemeToggle` y `LocaleSwitcher` reescritos con `ToggleGroup` — flechas izq/der + focus management automático vía Radix. Eliminados los SVG inline (`SunIcon`, `MoonIcon`, `MonitorIcon`).
- `Toaster` montado en layout root (paralelo a providers), `TooltipProvider` envuelve children.
- `src/lib/utils.ts` con helper canónico `cn()` (clsx + tailwind-merge).
- Tokens CSS extendidos (`--card`, `--popover`, `--secondary`, `--accent`, `--destructive`, `--input`, `--ring`, `--radius`) sobre la paleta de `web-foundation`. Cero breaking changes.
- Tailwind extendido: container, animations (`tailwindcss-animate` plugin), border-radius escalado por `--radius`.

## Spec

Spec actualizada (v0.2.0): [`openspec/specs/dashboard-web/spec.md`](openspec/specs/dashboard-web/spec.md)
Histórico del change: [`openspec/changes/archive/ui-foundation/`](openspec/changes/archive/ui-foundation/)

## Test plan

- [ ] `pnpm install` desde `dashboard-web/` (resuelve 11 nuevas deps + 1 devDep).
- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm lint` pasa.
- [ ] `pnpm test` — tests previos siguen verdes + nuevo `src/lib/utils.test.ts` con 6 specs del `cn()`.
- [ ] `pnpm build` compila. First-load JS de `/` ≤ 220KB.
- [ ] Visual: `/` y `/en` se ven idénticos al estado pre-cambio (el header tiene LocaleSwitcher segmentado + Separator + ThemeToggle segmentado; CTAs ahora son `Button`; stats viven en `Card`).
- [ ] A11y manual de toggles según [`dashboard-web/SMOKE.md`](dashboard-web/SMOKE.md) sección 4.1:
  - Tab navega; flechas izq/der cambian item dentro del grupo; Enter/Space activa.
  - VoiceOver anuncia "Tema, [Sol|Luna|Sistema], pressed" y similar para locale.
- [ ] Smoke de toast: agregar `<Button onClick={() => toast('test')}>` temporal y verificar tema correcto.
- [ ] `pnpm lighthouse` mantiene SEO ≥ 0.95 y a11y ≥ 0.90.

## Riesgos

- **11 nuevas deps en lockfile** (Radix + class-variance-authority + clsx + tailwind-merge + lucide-react + sonner + react-hook-form + @hookform/resolvers). Verificar que las versiones resueltas estén dentro de los rangos `^` declarados.
- **`tailwindcss-animate` agregado al config.** Removerlo rompe animaciones de Dialog/DropdownMenu/Tooltip.
- **`TooltipProvider` ahora obligatorio en el árbol.** Si en `auth-foundation` se modifica el layout, no olvidar mantenerlo.

## Migración (no breaking changes en API pública)

- `ThemeToggle` y `LocaleSwitcher` cambian implementación interna pero **exponen la misma API**: `import { ThemeToggle } from '@/components/theme/ThemeToggle'` y `import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher'` siguen funcionando.

## Out of scope (siguientes changes)

- `auth-foundation` — Supabase SSR auth + protected routes (necesita `Form` que este change provee).
- `audit-runner` — UI que consume PageSpeed + scraper-api.
- DataTable, Calendar, Charts — entran cuando una feature los necesite, no preemptivamente.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
