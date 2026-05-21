# Chained PR plan — audit-intelligence-upgrade

## PR-1 — Scraper contract + crawl intelligence

**Scope**

- `scraper-api/internal/audit/types.go`
- `scraper-api/internal/audit/handler.go`
- `scraper-api/internal/audit/observability.go`
- `scraper-api/internal/audit/site_tree.go`
- `scraper-api/internal/audit/recommendations.go`
- `scraper-api/internal/audit/site_tree_test.go`
- `scraper-api/internal/audit/recommendations_test.go`
- `dashboard-web/src/lib/audit/types.ts`
- `dashboard-web/src/lib/audit/scraper.ts`

**Outcome**

- New optional payloads: `crawl`, `siteStructure`, `observability`, `recommendations`.
- Crawl cap default 15 pages (bounded 10..15).

## PR-2 — Audit detail UX + data confidence

**Scope**

- `dashboard-web/src/app/[locale]/(protected)/audit/[snapshotId]/page.tsx`
- `dashboard-web/src/app/[locale]/(protected)/audit/_components/{RecommendationsSection.tsx,SiteTreeSection.tsx,ObservabilitySection.tsx}`
- `dashboard-web/src/components/app/DataConfidence.tsx`
- `dashboard-web/src/app/[locale]/(protected)/gsc/page.tsx`
- `dashboard-web/src/app/[locale]/(protected)/gsc/[property]/layout.tsx`
- `dashboard-web/src/app/[locale]/(protected)/gbp/layout.tsx`
- `dashboard-web/messages/{es.json,en.json}`

**Outcome**

- New tabs: Recommendations, Structure, Observability.
- Visual tree with collapsible nodes.
- Simulated-data disclosure badges/notices for GSC and GBP.

## PR-3 — Compare persistence

**Scope**

- `dashboard-web/supabase/migrations/0005_seo_comparisons.sql`
- `dashboard-web/src/app/[locale]/(protected)/compare/_lib/persistence.ts`
- `dashboard-web/src/app/[locale]/(protected)/compare/_actions/run-comparison.ts`
- `dashboard-web/src/app/[locale]/(protected)/compare/_components/ComparisonHistory.tsx`
- `dashboard-web/src/app/[locale]/(protected)/compare/page.tsx`
- `dashboard-web/messages/{es.json,en.json}`

**Outcome**

- Compare runs persisted best-effort.
- Recent comparison history rendered in compare page.
