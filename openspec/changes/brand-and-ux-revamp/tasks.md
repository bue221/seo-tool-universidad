# Tasks: brand-and-ux-revamp

> Ejecutar en modo interactivo por fases.

## Phase A — Landing first

- [x] Definir assets de marca LumoSEO (nombre, tagline, logo textual inicial).
- [x] Actualizar `messages/en.json` y `messages/es.json` con namespaces de landing.
- [x] Rediseñar `src/app/[locale]/page.tsx` como landing profesional.
- [x] Crear/ajustar componentes de secciones (Hero, Features, HowItWorks, FAQ, CTA, Footer).
- [x] Revisar metadata/SEO de landing (`generateMetadata`, OG copy).
- [ ] Smoke visual mobile/desktop + a11y básico.

## Phase B — Auth UX polish

- [x] Homogeneizar layout de auth pages (`(auth)/layout.tsx`).
- [x] Mejorar formularios (labels, helpers, errores, estados pending).
- [ ] Mejorar feedback en actions (toast success/error coherente).
- [ ] Ajustar textos y jerarquía visual ES/EN.

## Phase C — Protected UX polish

- [x] Unificar navegación y encabezados en rutas protegidas.
- [x] Mejorar Dashboard como hub (entry points claros a módulos).
- [ ] Pulir `/audit` y detalle de snapshot con estados más claros.
- [ ] Pulir consistencia visual en `/gbp/*` y `/analytics`.

## QA / Validation

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] Smoke manual de navegación completa.
- [ ] Verificar budget de review por PR (<= 500 líneas aproximadas).

## Closure

- [ ] PR title sugerido (fase A): `feat(web): LumoSEO branding + professional landing [brand-and-ux-revamp]`
- [ ] Validar delta contra spec.
- [ ] Preparar archive al completar todas las fases.
