# Tasks: brand-and-ux-revamp

> Ejecutar en modo interactivo por fases.

## Phase A — Landing first

- [ ] Definir assets de marca LumoSEO (nombre, tagline, logo textual inicial).
- [ ] Actualizar `messages/en.json` y `messages/es.json` con namespaces de landing.
- [ ] Rediseñar `src/app/[locale]/page.tsx` como landing profesional.
- [ ] Crear/ajustar componentes de secciones (Hero, Features, HowItWorks, FAQ, CTA, Footer).
- [ ] Revisar metadata/SEO de landing (`generateMetadata`, OG copy).
- [ ] Smoke visual mobile/desktop + a11y básico.

## Phase B — Auth UX polish

- [ ] Homogeneizar layout de auth pages (`(auth)/layout.tsx`).
- [ ] Mejorar formularios (labels, helpers, errores, estados pending).
- [ ] Mejorar feedback en actions (toast success/error coherente).
- [ ] Ajustar textos y jerarquía visual ES/EN.

## Phase C — Protected UX polish

- [ ] Unificar navegación y encabezados en rutas protegidas.
- [ ] Mejorar Dashboard como hub (entry points claros a módulos).
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
