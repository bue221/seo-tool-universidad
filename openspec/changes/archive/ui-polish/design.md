# Design: ui-polish

## Principles

1. **App shell ≠ landing**. Landing puede ser "wow"; app shell debe ser denso y rápido.
   On-mount animation máx 400ms; nada de scroll-reveal en rutas internas.
2. **Sombras escalan con interactividad**. Card estática: shadow-sm. Card interactiva
   en hover: shadow-md + translateY(-2px). Modal/popover: shadow-xl + ring sutil.
3. **Movimiento con propósito**. Toda animación debe comunicar estado (mount, hover,
   focus, active). Ornamental queda prohibido.
4. **Tokens > overrides**. Sombras, blur amounts, transitions van como utilities
   declaradas en Tailwind config — no `style={{ boxShadow: ... }}` inline.

## Token additions

### CSS variables (globals.css)

```css
--shadow-sm: 0 1px 2px hsl(var(--foreground) / 0.04);
--shadow-md: 0 4px 12px hsl(var(--foreground) / 0.06), 0 1px 3px hsl(var(--foreground) / 0.04);
--shadow-lg: 0 12px 32px hsl(var(--foreground) / 0.10), 0 4px 8px hsl(var(--foreground) / 0.04);
--shadow-glow: 0 0 0 1px hsl(var(--primary) / 0.20), 0 8px 24px hsl(var(--primary) / 0.25);
```

### Tailwind extensions

```ts
keyframes: {
  shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
  'fade-up': {
    from: { opacity: '0', transform: 'translateY(8px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  shimmer: 'shimmer 1.6s linear infinite',
  'fade-up': 'fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1)',
},
boxShadow: {
  // hereda de las CSS vars, expuestas como utilities
  soft: 'var(--shadow-sm)',
  card: 'var(--shadow-md)',
  pop: 'var(--shadow-lg)',
  glow: 'var(--shadow-glow)',
},
```

## Background mesh + texture

Body recibe dos capas (overlay-style):

1. **Mesh** (capa 1, ya existe — ajustada): tres `radial-gradient` con `--primary` y `--accent` a 8-12% opacity en esquinas opuestas.
2. **Dot grid** (capa 2, nueva): `background-image: radial-gradient(circle at center, hsl(var(--foreground) / 0.04) 1px, transparent 1px); background-size: 24px 24px;`. Sólo visible en hero/landing; en app shell se omite para no distraer.

Implementación: clase utility `.bg-mesh` y `.bg-dots` que se componen, no globales en `body`.

## Sidebar active indicator

Sin framer-motion no podemos hacer slide real entre items. Patrón elegido:

```tsx
<Link
  data-active={isActive}
  className="group relative flex rounded-md px-3 py-2 transition-colors duration-200
             text-muted-foreground hover:text-foreground
             data-[active=true]:text-foreground data-[active=true]:bg-accent/20"
>
  <span aria-hidden
    className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary
               opacity-0 transition-opacity duration-200
               group-data-[active=true]:opacity-100" />
  {label}
</Link>
```

Trade-off documentado: el efecto es "highlight transition", no "sliding pill".
Es 90% del impacto visual al 0% del costo de bundle.

## Cmd+K palette

`cmdk` package (8KB gzipped, mismo que usa shadcn). Componente global montado en
`(protected)/layout.tsx`:

- Hotkey: `cmd+k` (mac) / `ctrl+k` (otros). Detectado con `useEffect` + keydown listener.
- Items: derivados de `NAV_ITEMS` del sidebar.
- Items extra: "Toggle theme", "Sign out" (acciones globales).
- Estilos: variante `bg-popover/95 backdrop-blur-xl shadow-pop` + `animate-in fade-in zoom-in-95`.

Decisión: mountado **solo** en `(protected)`. En landing/auth no tiene sentido todavía.

## Animations on mount

`page.tsx` y `layout.tsx` principales reciben `animate-in fade-in slide-in-from-bottom-2 duration-500`.
Es CSS puro vía `tailwindcss-animate` (ya instalado). Se aplica una sola vez al SSR boundary;
no afecta navegación cliente posterior.

## Typography display

Carga `Inter` con `next/font/google` (variable). H1 usa:

```css
font-feature-settings: "ss01", "cv01", "cv11";
letter-spacing: -0.02em;
line-height: 1.05;
```

Esto da el aire "Söhne-like" sin pagar la licencia de Söhne.

## Button gradient + glow

Variante `primary` reemplaza fondo plano por:

```
bg-gradient-to-b from-primary to-primary/90
shadow-soft
hover:shadow-glow hover:from-primary hover:to-primary
transition-shadow duration-200
```

Sin animaciones JS; el "glow" es box-shadow con tinte primary.

## Skeleton shimmer

```tsx
<div className="relative overflow-hidden rounded-md bg-muted">
  <div className="absolute inset-0 animate-shimmer
                  bg-gradient-to-r from-transparent via-foreground/8 to-transparent
                  bg-[length:200%_100%]" />
</div>
```

## Risks aceptados

| Risk | Decisión |
|------|----------|
| Sidebar indicator no es "Linear-style" sliding | Documentado, acepta trade-off. |
| `cmdk` add +8KB bundle | Aceptable, sustituye potencialmente futuras pantallas de búsqueda. |
| Inter font hace request a Google Fonts en runtime | `next/font` self-hostea — no hay external request en runtime. |
| Backdrop-blur degrada en GPU vieja | Fallback `bg-card/95` (sólido) cubre. |
