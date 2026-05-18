# Tasks: ui-foundation

> Estado de implementación al archivo del change (2026-05-18). Items con
> `[x]` están hechos en código; los `[ ]` requieren `pnpm install` con red.

---

## 0. Dependencias

- [x] Agregar a `dashboard-web/package.json`:
  - `dependencies`: `@hookform/resolvers`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-separator`, `@radix-ui/react-slot`, `@radix-ui/react-tabs`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `class-variance-authority`, `clsx`, `lucide-react`, `react-hook-form`, `sonner`, `tailwind-merge`.
  - `devDependencies`: `tailwindcss-animate`.
- [ ] Cuando haya red: `pnpm install` (resuelve lockfile). *(Bloqueado por red corporativa.)*

## 1. Config

- [x] `dashboard-web/components.json` con `style: "default"`, `baseColor: "neutral"`, `cssVariables: true`, `iconLibrary: "lucide"`, aliases.
- [x] `src/lib/utils.ts` con helper `cn`.
- [x] `tailwind.config.ts` extendido (plugin `tailwindcss-animate`, container, colors, borderRadius, keyframes/animation accordion).
- [x] `src/styles/globals.css` con tokens nuevos: `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--secondary`, `--secondary-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--input`, `--ring`, `--radius`.

## 2. Componentes UI base

### 2.1 Primitivos
- [x] `button.tsx` (6 variants + 4 sizes + asChild).
- [x] `input.tsx`.
- [x] `label.tsx`.
- [x] `badge.tsx` (4 variants).
- [x] `separator.tsx`.
- [x] `skeleton.tsx`.

### 2.2 Composiciones
- [x] `card.tsx` (Card + Header + Title + Description + Content + Footer).
- [x] `tabs.tsx`.

### 2.3 Overlays
- [x] `dialog.tsx`.
- [x] `sheet.tsx` (4 sides).
- [x] `tooltip.tsx` (incluye `TooltipProvider`).
- [x] `dropdown-menu.tsx` (con sub-menus, checkbox, radio, shortcut).

### 2.4 Toggle / Toggle Group
- [x] `toggle.tsx` (cva con 2 variants + 3 sizes).
- [x] `toggle-group.tsx` (con Context para heredar variant/size).

### 2.5 Toast
- [x] `sonner.tsx` (Toaster con sync de next-themes).

### 2.6 Form
- [x] `form.tsx` (Form + FormField + FormItem + FormLabel + FormControl + FormDescription + FormMessage).

## 3. Migración de componentes existentes

- [x] `src/components/theme/ThemeToggle.tsx`:
  - `<ToggleGroup type="single" size="sm">` + iconos `Sun`/`Moon`/`Monitor` de `lucide-react`.
  - SVG inline eliminados.
  - `mounted` flag, `useTranslations('Theme')` mantenidos.
- [x] `src/components/i18n/LocaleSwitcher.tsx`:
  - `<ToggleGroup type="single" size="sm">` con texto ES/EN.
  - `useTransition`, `usePathname`/`useRouter` localizados mantenidos.

## 4. Layout

- [x] `src/app/[locale]/layout.tsx`:
  - Import `Toaster` de `@/components/ui/sonner`.
  - Import `TooltipProvider` de `@/components/ui/tooltip`.
  - `<TooltipProvider delayDuration={200}>` envuelve `{children}` dentro de `NextIntlClientProvider`.
  - `<Toaster richColors closeButton position="bottom-right" />` dentro de `ThemeProvider` (paralelo a los providers).
- [x] Bonus: home actualizada — CTAs ahora usan `Button`, stats viven en `Card`, `Separator` vertical entre toggles.

## 5. Verificación visual + a11y

- [ ] **Smoke visual:** `/` y `/en` se ven idénticos al estado pre-cambio. *(Bloqueado por install.)*
- [ ] **A11y manual:** Tab, flechas, Enter/Space, VoiceOver. *(Bloqueado por install.)*
- [ ] **Toast manual:** botón temporal con `toast('test')`. *(Bloqueado por install.)*
- [ ] **Bundle:** first-load JS ≤ 220KB en `pnpm build`. *(Bloqueado por install.)*

## 6. Tests

- [ ] `pnpm test` — los tests existentes siguen verdes (regresión). *(Bloqueado por install.)*
- [x] **Extra:** `src/lib/utils.test.ts` con 6 specs del `cn()` (combinación simple, twMerge resuelve conflictos, filtra falsy, objetos condicionales, arrays anidados, último gana en background).

## 7. Documentación

- [x] `dashboard-web/README.md` actualizado:
  - Header menciona ambas foundations activas.
  - Tabla "Estado del scaffold" simplificada a tabla de changes.
  - Estructura expandida con `src/components/ui/*` (16 archivos listados).
  - `lib/utils.ts` agregado a la estructura.
  - Stack actualizado: Shadcn, lucide, sonner, react-hook-form, cva.
  - Cookbook con 3 recetas nuevas: agregar componente Shadcn, crear formulario con zod, disparar toasts.
- [x] `dashboard-web/agents.md` actualizado:
  - Tabla de capacidades con 4 entries nuevas: UI System, Iconos, Toasts, Forms.
  - 5 invariantes nuevas (6–10): no reescribir primitives, lucide para iconos, sonner para toasts, react-hook-form + zod para forms, cn() para estilos.
  - Roadmap: `web-foundation` archived, `ui-foundation` activo.
- [x] `dashboard-web/SMOKE.md` actualizado:
  - Sección 4.1: A11y de Toggles migrados (Tab, flechas, VoiceOver).
  - Sección 4.2: UI primitives (Button, Card, Separator, Toaster).
  - Sección 2 (tests) menciona `utils.test.ts`.

## 8. Cierre

- [ ] PR título: `feat(web): Shadcn/ui foundation [ui-foundation]`. *(Bloqueado por git + red — body listo en `PR_DRAFT.md`.)*
- [ ] Validar specs: `openspec validate ui-foundation`. *(Bloqueado por CLI no instalado; review manual del delta hecho.)*
- [x] **Archive equivalente offline:** delta promovido a [`openspec/specs/dashboard-web/spec.md`](../../../specs/dashboard-web/spec.md) (v0.2.0). Change movido a [`openspec/changes/archive/ui-foundation/`](.) con banner ARCHIVED.
- [x] **Índices actualizados:** `openspec/README.md` y `AGENTS.md` raíz reflejan v0.2.0 y `ui-foundation` archived.
