# Tasks — ui-command-center

Auto-forecast: **3 PRs encadenados** (budget 1000 LOC/PR).

---

## PR-1 · `ui-cc-foundation` (~600-800 LOC)

### Tokens & config

- [ ] `src/styles/globals.css`: redefinir rampa `.dark` (surface-1/2/3, border-strong,
      primary 142 70% 55%, primary-soft, radius 1rem, shadow-card/pop/glow nuevas).
- [ ] `src/styles/globals.css`: nuevas utilidades `.text-gradient-brand`,
      `.bg-grid-faint`, `.ring-active`.
- [ ] `src/styles/globals.css`: ajustar `.bg-mesh` para que opere sobre near-black
      sin saturar (reducir alphas a 0.06).
- [ ] `tailwind.config.ts`: agregar `fontSize.display`, `fontSize.display-sm`,
      `letterSpacing.tracked-label`, `borderRadius.2xl/3xl`, colors `surface-1/2/3`
      y `border-strong`.

### Primitives nuevos

- [ ] `src/components/ui/kpi-card.tsx` — KpiCard con icon, label, value, trend.
- [ ] `src/components/ui/gradient-heading.tsx` — H1/H2/H3 con accent gradient.
- [ ] `src/components/ui/section-label.tsx` — label uppercase tracked.
- [ ] `src/components/ui/icon-badge.tsx` — caja tintada para iconos.
- [ ] `src/components/ui/trend-pill.tsx` — pill verde/rojo con flecha + delta.
- [ ] `src/components/ui/command-bar.tsx` — trigger inline del CommandPalette.

### Variantes en primitives existentes

- [ ] `src/components/ui/card.tsx`: variantes `default | surface | elevated | ghost`
      (default = surface-2/80 + border/60; elevated = surface-3 + shadow-pop).
- [ ] `src/components/ui/button.tsx`: variant `glow` (primary + ring-glow).
- [ ] `src/components/ui/badge.tsx`: variants `tier` (uppercase tracked) y
      `metric-up/metric-down`.

### Tests

- [ ] Unit: `KpiCard` renderiza trend up/down/flat con `aria-label` correcto.
- [ ] Unit: `GradientHeading` envuelve children `accent` en span con clase.
- [ ] Snapshot: variantes nuevas de Card/Button no rompen las existentes.

### DoD PR-1

- [ ] `pnpm build` verde.
- [ ] Storybook/manual: cada primitive renderiza standalone en `/_design` (página
      temporal — borrar en PR-3).
- [ ] Light mode no rompe (visual smoke en `/` actual sin migrar).

---

## PR-2 · `ui-cc-shell` (~400-600 LOC)

### Shell

- [ ] `(protected)/_components/Sidebar.tsx`: rediseño completo según design.md §4
      (brand block, section labels, items con `ring-active`, footer user, toggle
      collapse persistido en localStorage).
- [ ] `(protected)/_components/Topbar.tsx`: **nuevo** — extraer header de
      `(protected)/layout.tsx` y componer `[brand-md-hidden] [CommandBar]
      [Bell] [GridSwitch] [UserPill]`. UserPill consume `user` de Clerk.
- [ ] `(protected)/_components/UserPill.tsx`: avatar 32px + nombre + tier badge +
      dot status.
- [ ] `(protected)/_components/NotificationsBell.tsx`: stub con contador (mock).
- [ ] `(protected)/layout.tsx`: composición `grid grid-cols-[16rem_1fr]
      grid-rows-[4rem_1fr]` con Sidebar fija y Topbar sticky.
- [ ] `[locale]/layout.tsx`: `ClerkProvider` con `appearance` mapeado a tokens
      (ver design.md §6). Instalar `@clerk/themes` si hace falta.

### i18n

- [ ] `messages/{es,en}.json`: agregar
      - `Chrome.CommandBar.placeholder`
      - `Chrome.Sidebar.sectionCommand`
      - `Chrome.Sidebar.sectionInsights`
      - `Chrome.Sidebar.collapse`
      - `Chrome.User.tier` (default "Empresarial" / "Enterprise")
      - `Chrome.Notifications.empty`

### DoD PR-2

- [ ] Toda ruta protegida muestra sidebar permanente + topbar nuevo.
- [ ] Clerk login/signup heredan tema dark sin parches CSS sueltos.
- [ ] Collapse sidebar persiste entre navegaciones.
- [ ] Mobile: sidebar pasa a drawer (Sheet de shadcn) en `<md`.
- [ ] A11y: `aria-current="page"` en item activo, skip-link al main.

---

## PR-3 · `ui-cc-pages` (~700-1000 LOC — partir si excede)

### App pages

- [ ] `(protected)/dashboard/page.tsx`: GradientHeading "Comando Nexus" + KPI grid
      4×2 + ChartCard conversión (2/3) + DonutCard canales (1/3). Reusar datos
      mock existentes.
- [ ] `(protected)/audit/page.tsx`: hero + lista de auditorías como cards con
      KpiCard-style summary.
- [ ] `(protected)/audit/[snapshotId]/page.tsx`: hero gradient + KPI strip +
      tabs re-skinneadas (WooRankSection ya existe — solo adaptar shell).
- [ ] `(protected)/compare/page.tsx`: form con CommandBar-style input + tabla y
      radar embebidos en cards `elevated`.
- [ ] `(protected)/gsc/page.tsx` + `gsc/[property]/*/page.tsx`: hero + KPI cards
      por dimensión.
- [ ] `(protected)/gbp/page.tsx` + sub-rutas: hero + KPI cards.
- [ ] `(protected)/analytics/page.tsx`: hero + KPI cards.
- [ ] `(protected)/settings/page.tsx`: secciones con SectionLabel + Card surface.
- [ ] `(protected)/onboarding/page.tsx`: re-skin con primitives nuevos.

### Marketing & auth

- [ ] `[locale]/page.tsx` (landing): hero con `bg-grid-faint` + GradientHeading +
      dual CTA (glow primary + ghost) + sections grid con IconBadge cards + CTA
      final con `bg-primary/10` + glow.
- [ ] `(auth)/layout.tsx`: wrapper centered con `bg-grid-faint` opcional.
- [ ] `(auth)/login/page.tsx` + `signup/page.tsx`: contenedor con SectionLabel
      "Acceso" + Clerk component embebido.

### Limpieza

- [ ] Borrar `/_design` (página temporal de PR-1).
- [ ] Borrar utilidades muertas en `globals.css` (si `.bg-mesh` queda sin uso).
- [ ] Actualizar capturas en `design.md` con screenshots reales.

### DoD PR-3

- [ ] `pnpm build` verde.
- [ ] Todas las rutas listadas renderizan sin errores con datos reales/mock.
- [ ] Lighthouse a11y ≥ 95 en `/` y `/dashboard`.
- [ ] QA manual sign-off por usuario antes de merge.

---

## Verification (post-PR3)

- [ ] `pnpm test` en `dashboard-web` verde.
- [ ] `pnpm build` verde.
- [ ] Visual review: landing + login + dashboard + audit detail + compare + gsc
      coinciden con design.md.
- [ ] Spec bump: `dashboard-web` v0.7.0 → v0.8.0 con sección "Visual language:
      command center".
- [ ] Archivar `ui-polish` (superseded) y `ui-command-center` al cerrar PR-3.
