# Tasks: audit-intelligence-upgrade

**Execution mode:** interactive
**PR strategy:** chained-auto
**Review budget:** 800 LOC por PR

## PR-1 — Contract + scraper foundations

- [ ] Update `openspec/specs/audit-contract/spec.md` delta with optional fields:
  - [ ] `crawl`
  - [ ] `siteStructure`
  - [ ] `observability`
  - [ ] `recommendations`
- [ ] Add/refresh scraper-api delta in `openspec/changes/.../specs/scraper-api/spec.md`.
- [ ] Extend `scraper-api/internal/audit/types.go` with new structs.
- [ ] Add crawl-tree builder in scraper (`maxPages <= 15`, `maxDepth=2`).
- [ ] Add stage timers and populate `observability`.
- [ ] Unit tests for URL normalization, BFS cap, truncation flag.

## PR-2 — Dashboard audit detail improvements

- [ ] Extend `dashboard-web/src/lib/audit/types.ts` for new optional fields.
- [ ] Add new tabs in `audit/[snapshotId]/page.tsx`:
  - [ ] Recommendations
  - [ ] Structure
- [ ] Create components:
  - [ ] `RecommendationsSection.tsx`
  - [ ] `SiteTreeSection.tsx`
  - [ ] `SiteTree.tsx`
- [ ] Add confidence badges and simulated-data disclosures in:
  - [ ] GSC pages
  - [ ] GBP pages

## PR-3 — Compare persistence + observability UI

- [ ] New migration: `seo_comparisons` with RLS.
- [ ] Persistence functions in compare module.
- [ ] Persist successful comparison runs.
- [ ] Show recent comparison history in Compare page.
- [ ] Show stage-level audit observability in audit detail.

## PR-4 — Recommendation engine v1

- [ ] Deterministic rules mapping audit findings -> recommendations.
- [ ] Priority sorting (impact/effort).
- [ ] i18n copy for recommendation labels.
- [ ] Tests for rule coverage and ordering.

## Verify

- [ ] `scraper-api`: `go test ./...`
- [ ] `dashboard-web`: `npm run test`
- [ ] `dashboard-web`: `npm run typecheck`
- [ ] E2E smoke manual:
  - [ ] audit a site with >15 internal links -> output capped at 15
  - [ ] tree tab renders expected hierarchy
  - [ ] compare history lists latest saved runs

## Archive

- [ ] Validate change
- [ ] Archive when merged
