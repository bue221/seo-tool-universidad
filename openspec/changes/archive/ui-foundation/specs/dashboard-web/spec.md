# Delta: dashboard-web @ ui-foundation

> ⚠️ **ARCHIVED — 2026-05-18.** Este delta fue promovido a la spec oficial.
> Ver [`openspec/specs/dashboard-web/spec.md`](../../../../../specs/dashboard-web/spec.md)
> para el estado actual. Este archivo se preserva como histórico del change
> que introdujo la capability UI System y modificó ThemeToggle/LocaleSwitcher.

---

## ADDED — Capability: UI System (Shadcn/ui + Radix primitives)

### Filosofía

- **Componentes copy-paste, no librería:** los componentes UI viven en
  `src/components/ui/` como código del repo, no como dep externa. Cero lock-in
  versionado; refactor libre.
- **Accesibilidad por default:** todos los primitives de overlay/menu/toggle
  son `@radix-ui/react-*` — focus management, `aria-*`, navegación por teclado
  y screen reader resueltos por la librería.

### Componentes activos

| Componente | Origen | Uso |
|------------|--------|-----|
| `Button` | Shadcn | Variantes default/destructive/outline/secondary/ghost/link, sizes default/sm/lg/icon. |
| `Input`, `Label` | Shadcn | Inputs de texto. |
| `Card` (+ sub-components) | Shadcn | Contenedor visual con header/content/footer. |
| `Badge` | Shadcn | Variantes default/secondary/outline/destructive. |
| `Tooltip` | Shadcn (Radix) | Hover/focus info. |
| `Toggle`, `ToggleGroup` | Shadcn (Radix) | Selección segmentada (usado por ThemeToggle y LocaleSwitcher). |
| `DropdownMenu` | Shadcn (Radix) | Menús flotantes. |
| `Dialog`, `Sheet` | Shadcn (Radix) | Modales y drawers. |
| `Tabs` | Shadcn (Radix) | Navegación tabbed. |
| `Separator` | Shadcn (Radix) | Divisores. |
| `Skeleton` | Shadcn | Loading states. |
| `Form` (+ subcomponents) | Shadcn | Bridge a `react-hook-form` + `zodResolver`. |
| `Toaster` (sonner) | Shadcn + Sonner | Notificaciones con stack management. |

### Configuración

- `components.json` en el root de `dashboard-web/` con:
  - `style: "default"`, `baseColor: "neutral"`, `cssVariables: true`.
  - `iconLibrary: "lucide"`.
  - Aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
- `src/lib/utils.ts` exporta `cn(...inputs)` = `twMerge(clsx(...inputs))`.
- `tailwindcss-animate` plugin habilitado en `tailwind.config.ts`.

### Tokens CSS (extensión)

Se agregan a `src/styles/globals.css` además de los existentes de
`web-foundation`:

| Token | `:root` (light) | `.dark` |
|-------|-----------------|---------|
| `--card`, `--card-foreground` | igual a `--background` / `--foreground` | igual |
| `--popover`, `--popover-foreground` | igual a `--background` / `--foreground` | igual |
| `--secondary`, `--secondary-foreground` | hsl neutral claro | hsl neutral oscuro |
| `--accent`, `--accent-foreground` | hsl neutral claro | hsl neutral oscuro |
| `--destructive`, `--destructive-foreground` | rojo high-contrast | rojo desaturado |
| `--input` | igual a `--border` | igual a `--border` |
| `--ring` | tono primary | tono primary |
| `--radius` | `0.5rem` | `0.5rem` |

### Iconos

- Librería: **`lucide-react`**.
- Tree-shaking activo: `import { Sun } from 'lucide-react'` produce bundle
  mínimo (verificado en build).
- Se prohíbe SVG inline en componentes nuevos — usar lucide o copiar a un
  archivo dedicado en `src/components/icons/`.

### Toaster

- Una instancia montada en `app/[locale]/layout.tsx` (después de
  `NextIntlClientProvider`).
- `theme` heredado de `next-themes` (light/dark/system → toasts coinciden).
- Disparar toasts: `import { toast } from 'sonner'; toast('msg')`.

### Forms

- Stack obligatorio para formularios: **`react-hook-form` + `zodResolver`** vía
  el componente `Form` de Shadcn.
- Schemas zod viven cerca del componente que los usa.
- `FormField` retorna props compatibles con cualquier input controlado
  (`Input`, `Select`, `Checkbox`, etc.).

### Invariantes nuevas

1. **No reescribir primitives** (`Button`, `Input`, etc.) por feature — usar
   los de `@/components/ui/`. Si una variante no existe, agregarla al
   componente base con `cva`, no clonarlo.
2. **Iconos via `lucide-react`** — no inline SVG.
3. **Toasts via `sonner`** — no escribir un sistema de notificaciones ad-hoc.
4. **Forms con `react-hook-form` + `zod`** — sin `useState` manual para inputs
   controlados en formularios.

---

## MODIFIED — Capability: Theme (light / dark / system)

### Cambio en `ThemeToggle`

- **Antes:** 3 botones HTML plain con SVG inline (`SunIcon`, `MoonIcon`,
  `MonitorIcon`) y `aria-pressed` manual.
- **Después:** `<ToggleGroup type="single">` + 3 `<ToggleGroupItem>` con
  iconos `Sun`/`Moon`/`Monitor` de `lucide-react`.
- **API pública:** sin cambios — sigue exportado como
  `import { ThemeToggle } from '@/components/theme/ThemeToggle'`.
- **Comportamiento:** idéntico. `mounted` flag para hidratación se mantiene.
- **Accesibilidad mejorada:**
  - Navegación con flecha izq/der entre items (Radix automático).
  - `aria-pressed` se vuelve `data-state="on"|"off"` (estándar Radix; los
    screen readers modernos lo interpretan correctamente).

### Cambio en provider config

- Sin cambios — `<ThemeProvider attribute="class" defaultTheme="system"
  enableSystem disableTransitionOnChange>` se mantiene.

---

## MODIFIED — Capability: Internationalization (i18n)

### Cambio en `LocaleSwitcher`

- **Antes:** 2 botones HTML plain con texto.
- **Después:** `<ToggleGroup type="single">` + 2 `<ToggleGroupItem>` con
  texto `ES`/`EN`.
- **API pública:** sin cambios.
- **Comportamiento:** `useTransition` para feedback visual se mantiene.
- **Accesibilidad mejorada:** navegación con flechas, focus management
  automático.

### Layout: TooltipProvider obligatorio

- `app/[locale]/layout.tsx` ahora envuelve `{children}` también con
  `<TooltipProvider>` (de `@/components/ui/tooltip`).
- Sin esto, cualquier `<Tooltip>` que se use después lanza warning en
  consola.
- Orden de wrap: `<ThemeProvider> → <NextIntlClientProvider> →
  <TooltipProvider> → {children}` + `<Toaster />` paralelo.

---

## ADDED — Capability: Build artifacts (verificación post-implementación)

| Endpoint | Estado esperado |
|----------|-----------------|
| `pnpm build` first-load JS de `/` | ≤ 220KB (baseline + Radix primitives + lucide tree-shaken) |
| `pnpm dev` con `<Tooltip>` montado | Sin warnings de TooltipProvider faltante |
| `pnpm dev` con `toast('test')` | Toast visible con theme correcto (auto light/dark) |

---

## Verificación

Esta spec se considera satisfecha cuando:

- [ ] Visual: `/` y `/en` se ven idénticos al estado pre-cambio en ambos temas.
- [ ] A11y: Tab + flechas funcionan en ThemeToggle y LocaleSwitcher.
      Anuncio correcto en VoiceOver/NVDA.
- [ ] Bundle: first-load JS ≤ 220KB.
- [ ] Smoke de toast: `toast('test')` desde un Button temporal muestra
      notificación con theme correcto.
- [ ] Tests existentes (`metadata.test.ts`, `routing.test.ts`) siguen verdes.
- [ ] Lighthouse a11y ≥ 0.90 sigue cumpliendo.
