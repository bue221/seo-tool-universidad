# Tasks: product-ui-completion

## Phase 1 — Shell + dashboard

- [x] Build protected app shell (sidebar/topbar/breadcrumb scaffold).
- [x] Create reusable UI primitives (`PageHeader`, `KpiCard`, `SectionCard`).
- [x] Replace current `/dashboard` placeholder with KPI hub + recent activity.

## Phase 2 — Onboarding + settings

- [x] Add `/onboarding` route and initial wizard flow.
- [x] Add `/settings` route with profile/preferences skeleton.
- [ ] Connect onboarding completion state (minimal persistence).

## Phase 3 — Tables + charts

- [x] Upgrade audit history to table + filters.
- [x] Upgrade GBP lists (posts/reviews) with richer tabular UX.
- [x] Implement analytics charts (score trend, sentiment, tracking).

## Phase 4 — Visual redesign

- [x] Update color tokens in `globals.css` for non-flat visual language.
- [x] Add elevation/gradient/hover states across core pages.
- [ ] Final responsive and accessibility pass.

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] Manual smoke: auth → onboarding → dashboard → audit → analytics → settings
