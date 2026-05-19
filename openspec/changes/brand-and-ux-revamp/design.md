# Design: brand-and-ux-revamp

## 1. Product narrative

**Brand:** LumoSEO  
**Tagline:** Make your visibility measurable.

Narrativa: herramienta simple y profesional para auditar SEO técnico y convertir resultados en acciones.

## 2. Information architecture

### Public
- `/` Landing de marca LumoSEO
- `/login`
- `/signup`
- `/forgot-password`

### Protected
- `/dashboard`
- `/audit`
- `/audit/[snapshotId]`
- `/gbp/*`
- `/analytics`

## 3. Landing structure

1. **Header**: logo + nav + CTA
2. **Hero**: value prop + CTA primaria + secundaria
3. **Feature grid**: PageSpeed, Scraper, Tracking, Keywords/Sentiment
4. **How it works**: 3 pasos
5. **Trust strip**: “Built for academic/professional SEO workflows”
6. **FAQ**
7. **Final CTA**
8. **Footer**

## 4. UI system constraints

- Reusar primitives Shadcn existentes.
- No crear componentes duplicados si ya existe uno utilizable.
- Tokens consistentes para spacing/typography.
- Componentes nuevos deben vivir en `src/components/*` con nombres de dominio claros.

## 5. UX consistency rules

- Todos los forms: labels + helper + errors consistentes.
- Todos los estados async: loading/success/error con Sonner y/o skeleton.
- Navegación principal persistente en áreas protegidas.
- Copy en inglés por defecto de artefacto, traducido a ES/EN en messages.

## 6. Rollout plan

### Phase A (landing-first)
- Branding + landing completa + home metadata/SEO copy.

### Phase B (auth polish)
- Rediseño visual auth pages + feedback states.

### Phase C (app flow polish)
- Audit + dashboard + gbp + analytics consistency pass.

## 7. PR strategy

Auto-forecast con budget 500 líneas:
- PR1: branding + landing skeleton
- PR2: landing complete sections + i18n copy
- PR3: auth polish
- PR4: protected flow polish
