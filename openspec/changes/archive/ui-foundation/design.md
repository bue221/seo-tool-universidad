# Design: ui-foundation

**Scope:** Cómo se implementa `ui-foundation`. Decisiones de librerías, estructura, tradeoffs.

---

## 1. Decisiones de librerías

| Capa | Elección | Alternativas descartadas | Por qué |
|------|----------|--------------------------|---------|
| Component library | **Shadcn/ui** (copy-paste) | MUI, Mantine, Chakra, ant-design | No es una dep — son archivos en tu repo. Cero lock-in. Cero versionado de la "lib" porque eres tú. Es el estándar actual en stack React+Tailwind. |
| Style preset | **`default`** (vs `new-york`, `radix-nova`) | new-york, radix-nova | `default` es el más probado, neutral y compatible con extensiones. `new-york` agrega border radius extra; `radix-nova` es el nuevo experimental. Mantener boring para foundation. |
| Base color | **`neutral`** | gray, slate, zinc, stone | Ya tengo paleta neutral hardcoded en `globals.css` de `web-foundation`. Seguir alineado. |
| Icons | **`lucide-react`** | heroicons, tabler, phosphor | Default de Shadcn. Tree-shakeable. Cero conflicto con Radix. |
| Primitives accesibles | **`@radix-ui/react-*`** | headlessui, ariakit | Shadcn está construido sobre Radix. No hay alternativa real. |
| Toast | **`sonner`** | react-hot-toast, shadcn's own toast (deprecated) | Shadcn migró oficialmente a sonner. Integra con `next-themes`. Stack management out-of-the-box. |
| Form | **`react-hook-form` + `@hookform/resolvers/zod`** | Formik, Conform, custom | Shadcn's `Form` component es un wrapper de react-hook-form. Trivial integrar con zod (que ya uso para env validation). |
| Variant API | **`class-variance-authority` (cva)** | Tailwind variants (tv), conditional class strings | Shadcn estándar. Type-safe variants. |
| Class merging | **`tailwind-merge`** | classnames + manual dedup | Resuelve conflictos de Tailwind (`bg-white` + `bg-red-500` → `bg-red-500`). Sin él, el `cn()` helper falla en overrides. |
| Animations | **`tailwindcss-animate` plugin** | framer-motion para todo | Plugin pequeño que agrega utilities `animate-in`, `fade-in`, etc. Suficiente para 90% de los casos. framer-motion solo si una feature lo amerita. |

## 2. Estructura de carpetas

```
dashboard-web/
├── components.json                          # Shadcn config
└── src/
    ├── components/
    │   ├── ui/                              # ← NUEVO — Shadcn primitives
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── card.tsx
    │   │   ├── badge.tsx
    │   │   ├── tooltip.tsx
    │   │   ├── toggle.tsx
    │   │   ├── toggle-group.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── dialog.tsx
    │   │   ├── sheet.tsx
    │   │   ├── separator.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── tabs.tsx
    │   │   ├── sonner.tsx                   # Wrap del Toaster con next-themes
    │   │   └── form.tsx                     # react-hook-form bridge
    │   ├── i18n/LocaleSwitcher.tsx          # MIGRADO a ToggleGroup
    │   ├── seo/JsonLd.tsx                   # (sin cambios)
    │   └── theme/
    │       ├── ThemeProvider.tsx            # (sin cambios)
    │       └── ThemeToggle.tsx              # MIGRADO a ToggleGroup + lucide-react
    └── lib/
        ├── env.ts                           # (sin cambios)
        ├── metadata.ts                      # (sin cambios)
        └── utils.ts                         # ← NUEVO — cn() helper
```

## 3. `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**`rsc: true`** — habilita "use client" directive en componentes interactivos (Shadcn lo agrega donde corresponde).

## 4. Tokens CSS (extensión, no reemplazo)

Mantener los tokens ya activos de `web-foundation` y **agregar** los faltantes:

```css
/* src/styles/globals.css — sección :root expandida */
:root {
  /* Existentes de web-foundation */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --border: 240 5.9% 90%;

  /* NUEVOS de ui-foundation */
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;
}

.dark {
  /* Existentes */
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --border: 240 3.7% 15.9%;

  /* NUEVOS */
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}
```

## 5. `tailwind.config.ts` extendido

```ts
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
```

## 6. Migración de ThemeToggle

**Antes** (`web-foundation`):

- 3 botones `<button>` plain con SVG inline (`SunIcon`, `MoonIcon`, `MonitorIcon`).
- `aria-pressed` manual.
- Estilos repetidos en cada botón.

**Después** (`ui-foundation`):

```tsx
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function ThemeToggle() {
  const t = useTranslations('Theme');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ToggleGroup
      type="single"
      value={mounted ? theme : ''}
      onValueChange={(v) => v && setTheme(v)}
      aria-label={t('label')}
    >
      <ToggleGroupItem value="light" aria-label={t('light')}>
        <Sun className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label={t('dark')}>
        <Moon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label={t('system')}>
        <Monitor className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

**Beneficios**:
- `aria-pressed` y focus management automáticos.
- Navegación con flechas izquierda/derecha (Radix lo provee).
- ~30 líneas menos de código.
- Theming consistente con el resto del UI.

## 7. Migración de LocaleSwitcher

Mismo patrón con `ToggleGroup` pero con texto en vez de iconos:

```tsx
<ToggleGroup
  type="single"
  value={active}
  onValueChange={(v) => v && switchTo(v as Locale)}
  aria-label="Locale"
>
  {routing.locales.map((locale) => (
    <ToggleGroupItem key={locale} value={locale} aria-label={labelFor[locale]}>
      {locale.toUpperCase()}
    </ToggleGroupItem>
  ))}
</ToggleGroup>
```

## 8. Form helper (`Form` component de Shadcn)

Provee bridge entre react-hook-form y los componentes Shadcn:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { z } from 'zod';

const schema = z.object({ url: z.string().url() });

export function AuditForm() {
  const form = useForm({ resolver: zodResolver(schema) });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => console.log(data))}>
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Auditar</Button>
      </form>
    </Form>
  );
}
```

Este `AuditForm` **no se construye en este change** — solo se valida que el setup permita escribirlo así cuando llegue `audit-runner`.

## 9. Sonner Toaster — integración con theme

```tsx
// src/components/ui/sonner.tsx
'use client';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

export function Toaster(props: React.ComponentProps<typeof Sonner>) {
  const { theme = 'system' } = useTheme();
  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}
```

Se monta una sola vez en `app/[locale]/layout.tsx` después del `NextIntlClientProvider`. Componentes que disparan toasts importan `toast` de `sonner` directamente:

```tsx
import { toast } from 'sonner';
toast('Auditoría iniciada');
toast.success('Listo!', { description: '...' });
```

## 10. Tradeoffs aceptados

- **Shadcn no es una dep — son ~20 archivos en mi repo.** Pro: control total, refactoring fácil. Contra: actualizar Shadcn = re-correr CLI por componente (manual).
- **`lucide-react` sin tree-shake intencional**: import específico (`import { Sun } from 'lucide-react'`) tree-shake correctamente con SWC/esbuild. Si tu bundler tiene problemas, fallback a `lucide-react/icons/sun`.
- **`tailwindcss-animate` se mantiene aunque vivamos sin animaciones complejas**: lo usan los componentes de Shadcn (Dialog fade-in, etc.). Removerlo rompe el UI.
- **`sonner` agrega ~6KB gzipped**. Aceptable a cambio de toast con stacking + queue + a11y.
- **No metemos `framer-motion`**: si en una feature necesitamos motion compleja (drag, layout animations, gestures), evaluamos. Para 95% de los casos `tailwindcss-animate` alcanza.

## 11. Plan de rollout

1. PR único — instala deps, setup config, copia componentes UI, migra ThemeToggle + LocaleSwitcher.
2. Validar visualmente que `/` y `/en` se ven idénticos al estado pre-cambio.
3. Smoke a11y manual (Tab, Shift+Tab, flechas en los toggles).
4. Merge → siguiente change (`auth-foundation`) puede usar `Form`, `Card`, `Button`, `Input` directamente.
