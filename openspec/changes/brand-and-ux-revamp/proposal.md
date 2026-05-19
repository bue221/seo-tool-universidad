# Proposal: brand-and-ux-revamp

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-19
**Depends on:** `web-foundation`, `ui-foundation`, `auth-foundation`, `audit-runner`.

---

## Why

La plataforma ya tiene capacidades core, pero la UX visual y narrativa todavía se siente técnica/interna. Este change busca llevarla a nivel producto: marca clara, landing profesional y flujos consistentes para conversión y confianza.

## What

### In scope

1. **Branding oficial**
   - Nombre de marca: **LumoSEO**.
   - Tagline principal: **"Make your visibility measurable."**
   - Ajuste de identidad visual (paleta startup moderna, tipografía, tono de copy).

2. **Landing profesional (prioridad 1)**
   - Hero con propuesta de valor + CTA.
   - Secciones: Features, Cómo funciona, Beneficios, FAQ, CTA final.
   - Header sticky + footer de producto.
   - Copy ES/EN con next-intl.

3. **Sistema UI consistente**
   - Normalizar componentes Shadcn para cards, forms, states, badges, tables.
   - Estados unificados: loading, empty, partial error, full error.
   - Mejoras de spacing/jerarquía visual global.

4. **Pulido de flujos existentes (fase posterior a landing)**
   - Auth flow (login/signup/reset) con UX más profesional.
   - Audit flow (input → procesamiento → resultado) con feedback más claro.
   - Navegación coherente entre dashboard/audit/gbp/analytics.

5. **Calidad UX base**
   - Responsive mobile-first.
   - A11y mínima AA (foco visible, labels correctos, contraste).

### Out of scope

- Reescritura funcional de scraper-api.
- Nuevos módulos de negocio fuera de UI/UX.
- Rediseño completo de data model.

## Success metrics

- Landing lista para demo comercial/académica.
- Coherencia visual percibida entre home, auth y módulos protegidos.
- Reducción de fricción en flujo de auditoría (menos pasos confusos).
- Lighthouse a11y >= 0.90 en landing y rutas clave.

## Risks

- Scope creep de diseño (mucho polish, poco foco).
- Diffs grandes por tocar muchas pantallas.

## Mitigation

- Implementar por fases (landing primero).
- Mantener PRs dentro del budget de review (500 líneas aprox por tranche).
