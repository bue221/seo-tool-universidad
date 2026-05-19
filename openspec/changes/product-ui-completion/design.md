# Design: product-ui-completion

## 1. UX architecture

### Protected App Shell
- Left sidebar: Dashboard, Audit, GBP, Analytics, Settings.
- Topbar: search placeholder, locale/theme switchers, user menu.
- Content area with breadcrumb and contextual page header.

### Public/Auth
- Consistent auth card layout with trust copy and guided next steps.

## 2. Route map

- `/dashboard` → KPI hub + recent activity
- `/audit` + `/audit/[snapshotId]` → audit execution and analysis
- `/gbp/*` → profile/posts/reviews/insights
- `/analytics` → charts + filters + table
- `/settings` → profile/preferences/integrations placeholders
- `/onboarding` → wizard stepper for first-time users

## 3. Visual system

- Update global CSS tokens for richer depth:
  - background layers (base/surface/elevated)
  - accent gradients
  - stronger border and shadow hierarchy
- Add reusable page primitives:
  - `PageHeader`, `KpiCard`, `EmptyState`, `SectionCard`.

## 4. Data UI

- Analytics charts from existing snapshots data.
- Audit history and GBP lists as proper semantic tables where useful.
- Mobile fallback cards for table-heavy areas.

## 5. Rollout plan

1. Shell + dashboard foundation
2. Onboarding + settings
3. Tables + charts completion
4. Visual polish pass and copy tuning

## 6. Review workload strategy

Split into chained commits/PR slices to keep each tranche under review budget (~500 lines target).
