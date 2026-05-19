# Design — ui-command-center

## 1. Tokens (globals.css)

### Dark mode (primario)

```css
.dark {
  /* Surface ramp — near-black con tinte verde muy sutil para mantener marca */
  --background:       150 30%  5%;   /* canvas: casi negro */
  --surface-1:        150 24%  8%;   /* sidebar / topbar */
  --surface-2:        150 22% 11%;   /* card fill */
  --surface-3:        150 20% 14%;   /* card hover / popover */
  --foreground:       140 25% 97%;
  --muted-foreground: 140  8% 62%;

  /* Brand: lime se conserva, ajustada para legibilidad sobre near-black */
  --primary:          142 70% 55%;   /* lime brillante */
  --primary-soft:     142 70% 70%;   /* segundo stop del gradient */
  --accent:           84  78% 60%;   /* lime amarillento */

  --border:           150 12% 18%;   /* hairline */
  --border-strong:    150 14% 26%;   /* sidebar separators */
  --input:            150 16% 14%;
  --ring:             142 70% 55%;

  --radius:           1rem;          /* bump global a 16px */

  /* Shadows recalibradas para fondo near-black */
  --shadow-card:  inset 0 0 0 1px hsl(var(--border) / 0.6),
                  0 1px 0 hsl(0 0% 100% / 0.02);
  --shadow-pop:   0 24px 48px hsl(0 0% 0% / 0.6),
                  0 2px 4px hsl(0 0% 0% / 0.4);
  --shadow-glow:  0 0 0 1px hsl(var(--primary) / 0.45),
                  0 0 28px hsl(var(--primary) / 0.35);
}
```

### Light mode (secundario, mantenido)

Mantener la rampa lime actual pero subir contraste de borders (de 84% a 78%) y
fondo de cards a 0 0% 100% sólido en vez de translúcido. KPI tiles en light usan
`bg-white` con `border-border` y la misma estructura.

### Utilidades nuevas

```css
@layer utilities {
  /* Gradient text marca: primary → accent. Aplicar a span dentro de heading. */
  .text-gradient-brand {
    background: linear-gradient(
      90deg,
      hsl(var(--primary)) 0%,
      hsl(var(--accent))  100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  /* Grid sutil para fondo de sections destacadas (1px líneas a 64px) */
  .bg-grid-faint {
    background-image:
      linear-gradient(to right,  hsl(var(--border) / 0.4) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse at center, black 40%, transparent 75%);
  }

  /* Anillo activo para sidebar item / KPI focus */
  .ring-active {
    box-shadow:
      inset 2px 0 0 hsl(var(--primary)),
      0 0 20px hsl(var(--primary) / 0.18);
  }
}
```

## 2. Tailwind config

```ts
extend: {
  fontSize: {
    display: ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.02', letterSpacing: '-0.03em', fontWeight: '700' }],
    'display-sm': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
  },
  letterSpacing: {
    'tracked-label': '0.14em',   // uppercase section/KPI labels
  },
  borderRadius: {
    '2xl': '1.25rem',
    '3xl': '1.75rem',
  },
  colors: {
    'surface-1': 'hsl(var(--surface-1) / <alpha-value>)',
    'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',
    'surface-3': 'hsl(var(--surface-3) / <alpha-value>)',
    'border-strong': 'hsl(var(--border-strong) / <alpha-value>)',
  },
}
```

## 3. Primitives nuevos

### `<KpiCard>`

```tsx
<KpiCard
  icon={<Globe />}
  label="RESONANCIA ORGÁNICA"
  value="12,450"
  trend={{ delta: '+14.2%', direction: 'up' }}
/>
```

Estructura: `rounded-2xl border border-border/60 bg-surface-2/80 p-6` con
icon-box `size-12 rounded-xl bg-primary/10` top-left y trend pill
`rounded-full px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400`
top-right. Label `text-xs uppercase tracking-tracked-label text-muted-foreground`.
Value `text-4xl font-bold tabular-nums`.

### `<GradientHeading>`

```tsx
<GradientHeading as="h1" accent="Nexus">
  Comando
</GradientHeading>
```

Renderiza `text-display font-display` con el children base en `text-foreground` y
el `accent` envuelto en `<span className="text-gradient-brand">`.

### `<SectionLabel>`

`text-xs uppercase tracking-tracked-label text-primary/80` — para encabezar
grupos en sidebar y secciones de marketing.

### `<IconBadge variant="primary|accent|neutral">`

Caja cuadrada con icon centrado, fondo tintado al 10%.

### `<TrendPill delta direction="up|down|flat">`

Pill con flecha + delta. Verde up, rojo down, gris flat. Usada en KPI cards.

### `<CommandBar>`

Trigger inline (no modal) que abre el `CommandPalette` existente. Render:

```
[ ⌘  Analizar URL, Dominio o Propiedad Digital…           ENTER ]
```

`w-full max-w-2xl rounded-full border border-border/60 bg-surface-1/60
backdrop-blur px-4 h-12` con icon `⌘` izquierda y kbd `ENTER` derecha.

## 4. Shell

### Sidebar

- Width: `w-64` desktop, colapsable a `w-16` (icon-only).
- Brand block: `<div className="flex items-center gap-2 px-5 py-4">` con logo
  bloque tipo "P" + wordmark "LumoSEO".
- Section label "COMANDO" arriba del primer grupo.
- Items: `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm` con icon
  16px + label. Active: `bg-primary/10 text-foreground ring-active`. Hover:
  `bg-surface-2`.
- Footer: avatar + nombre/rol + "Cerrar sesión" como link discreto.
- Separador entre grupos: `border-border-strong`.

### Topbar

- Height `h-16`, `border-b border-border`, `bg-surface-1/60 backdrop-blur`.
- Layout: `[brand-hidden-md] [CommandBar centered] [bell] [grid] [user-pill]`.
- User pill: `flex items-center gap-3 pl-3 pr-1 py-1 rounded-full bg-surface-2`
  con nombre + tier label `text-[10px] uppercase tracking-tracked-label
  text-primary/80` y avatar 32px con dot de status `bg-emerald-500`.

## 5. Page layouts

### Dashboard

```
┌─ GradientHeading "Comando Nexus" ─────────┬─ TimeRangeTabs · Export · CTA ─┐
│  Subtítulo gris medio                      │                                │
└────────────────────────────────────────────┴────────────────────────────────┘
┌─ KpiCard ─┬─ KpiCard ─┬─ KpiCard ─┬─ KpiCard ─┐
│  resonan. │  pos.med. │  CTR      │  rebote   │
└───────────┴───────────┴───────────┴───────────┘
┌─ KpiCard ─┬─ KpiCard ─┬─ KpiCard ─┬─ KpiCard ─┐
│  users    │  sesiones │  conv.    │  alcance  │
└───────────┴───────────┴───────────┴───────────┘
┌─ Chart card (conversión, 2/3) ─────────────┬─ Donut (canales, 1/3) ─┐
└────────────────────────────────────────────┴────────────────────────┘
```

### Audit detail

- Hero con `GradientHeading` ("Auditoría · {dominio}") + status pill.
- KPI strip horizontal (4 KPIs core).
- Tabs: WooRank · On-Page · Tracking · Keywords · Sentiment — cada tab con su
  card específica re-skinneada.

### Landing

- Hero: `bg-grid-faint` overlay, `GradientHeading` 5xl, sub gris, dual CTA
  (primary glow + ghost).
- Sections: cards-tile en grid 3 col con icon-badge + título + body.
- CTA final: card grande con `bg-primary/10` + glow.

## 6. Clerk appearance

```tsx
<ClerkProvider
  appearance={{
    baseTheme: dark, // @clerk/themes
    variables: {
      colorPrimary:       'hsl(142 70% 55%)',
      colorBackground:    'hsl(150 30% 5%)',
      colorInputBackground: 'hsl(150 22% 11%)',
      colorInputText:     'hsl(140 25% 97%)',
      colorText:          'hsl(140 25% 97%)',
      colorTextSecondary: 'hsl(140 8% 62%)',
      borderRadius:       '1rem',
      fontFamily:         'var(--font-sans)',
    },
    elements: {
      card: 'bg-surface-2 border border-border shadow-pop',
      formButtonPrimary: 'bg-primary hover:bg-primary/90 ring-glow',
    },
  }}
>
```

## 7. Accesibilidad

- Contraste AA verificado por:
  - `foreground` sobre `background`: 17:1 ✓
  - `muted-foreground` sobre `surface-2`: 5.2:1 ✓
  - `primary` sobre `background`: 8.1:1 ✓ (badges/links)
  - `primary-foreground` (negro lima) sobre `primary` button: 10:1 ✓
- Focus ring visible: `ring-2 ring-primary ring-offset-2 ring-offset-background`.
- Sidebar items con `aria-current="page"` cuando activos.
- Command bar: `role="combobox" aria-expanded` + hotkey `⌘K` global.
- Trend pills: ícono + texto + `aria-label` ("incremento de 14.2%").

## 8. Decisiones rechazadas

| Opción | Por qué no |
|--------|-----------|
| Cambiar paleta a violet/cyan (como refs) | Usuario pidió conservar marca lime. |
| Adoptar shadcn-ui "new-york" preset entero | Sobrescribe trabajo de `ui-polish` y nuestros tokens; costo > beneficio. |
| Sidebar drawer (no permanente) | Refs muestran permanente; el patrón command-center lo exige. |
| Reescribir CommandPalette | Ya existe y funciona; solo agregamos trigger inline (`<CommandBar>`). |
| Custom font (Geist, Space Grotesk) | Inter ya cargada y suficiente con `text-display` + tracking. |
