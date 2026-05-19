# Proposal: product-ui-completion

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-19
**Depends on:** `brand-and-ux-revamp`, `auth-foundation`, `audit-runner`, `gbp-simulator`, `analytics-dashboard`.

---

## Why

El frontend actual cumple base técnica, pero no alcanza todavía nivel producto: faltan flujos clave (onboarding/settings), data UI completa (tablas + gráficos) y una identidad visual más atractiva.

## What

### In scope

1. **App shell profesional**
   - Sidebar + topbar + breadcrumbs + navegación persistente.
   - Layout consistente para todo `(protected)`.

2. **Dashboard real**
   - KPIs principales.
   - actividad reciente.
   - quick actions.
   - bloques de estado del negocio.

3. **Auth + onboarding + settings**
   - flujo de inicio de sesión/registro pulido.
   - onboarding wizard inicial post-signup.
   - página de settings (perfil + preferencias base).

4. **Tablas y gráficos productivos**
   - tablas para historial y módulos GBP.
   - gráficos de tendencias en analytics (score/sentiment/tracking).
   - filtros básicos por fecha/URL.

5. **Visual redesign (no plano)**
   - nueva paleta startup moderna (más contraste y profundidad).
   - superficie/elevación, gradientes suaves, estados hover/focus.
   - tokens globales consistentes light/dark.

### Out of scope

- nuevas capacidades backend del scraper.
- cambios de modelo de datos grandes fuera de los campos mínimos de onboarding/settings.

## Success metrics

- navegación y estructura de app completas para demo end-to-end.
- dashboard útil (no placeholder).
- tablas y gráficos funcionales con datos reales.
- mejora visual perceptible respecto al estado plano inicial.
- a11y base y responsive aprobados en rutas core.
