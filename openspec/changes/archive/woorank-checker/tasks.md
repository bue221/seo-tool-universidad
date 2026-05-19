# Tasks: woorank-checker

**Forecast LOC:** ~620 (chained PR — pasa el budget de 400).

## Plan de PRs (chained)

| PR | Slug | Forecast | Contenido |
|----|------|----------|-----------|
| 1  | `woorank-checker-engine` | ~380 | Go module: types, checks, orquestador, tests, contrato v0.2.0 |
| 2  | `woorank-checker-ui` | ~240 | TS types, `WoorankSection`, integración en `/audit/[snapshotId]`, i18n |

---

## PR 1 — Engine Go + contrato

- [ ] `scraper-api/internal/audit/types.go` — agregar `Woorank *WoorankResult` a `AuditResponse`, structs `WoorankResult` y `WoorankCheck`.
- [ ] `scraper-api/internal/audit/woorank.go`:
  - [ ] `RunWoorank(ctx, page) (*WoorankResult, error)`.
  - [ ] `computeScore(checks []WoorankCheck) float64`.
- [ ] `scraper-api/internal/audit/woorank_checks.go`:
  - [ ] 16 funciones `check*` (sync) o sus wrappers async.
  - [ ] Pesos en const block.
- [ ] `scraper-api/internal/audit/runner.go` — invocar `RunWoorank` en paralelo a los otros runners actuales.
- [ ] `scraper-api/internal/audit/woorank_test.go`:
  - [ ] Fixture HTML por cada check (pass/warn/fail mínimo).
  - [ ] `httptest.Server` para robotsTxt/sitemapXml/favicon.
  - [ ] Test de determinismo del score.
- [ ] `scraper-api/internal/audit/testdata/woorank/*.html` — fixtures.
- [ ] Actualizar `scraper-api/README.md` con bloque `woorank` en ejemplo de response.
- [ ] `openspec/specs/audit-contract/spec.md` queda preparado para bump v0.2.0 al archivar.

## PR 2 — UI dashboard-web

- [ ] `src/lib/audit/types.ts` — agregar tipos TS `WoorankResult`, `WoorankCheck`.
- [ ] `src/lib/audit/types.test.ts` — type guards si aplican.
- [ ] `src/app/[locale]/(protected)/audit/_components/WoorankSection.tsx`:
  - [ ] `ScoreRing` SVG inline.
  - [ ] Accordion shadcn agrupado por `category`.
  - [ ] `CheckRow` con icono pass/warn/fail (`Check`, `AlertTriangle`, `X` de lucide).
- [ ] `src/app/[locale]/(protected)/audit/[snapshotId]/page.tsx` — montar `<WoorankSection />` debajo de `<PageSpeedSection />`. Renderizar solo si `payload.woorank != null`.
- [ ] i18n namespaces:
  - [ ] `Woorank.Common` (score, categories, status labels).
  - [ ] `Woorank.Checks.*` — un key por checkId.
- [ ] Smoke test: snapshot sin `woorank` → no renderiza la sección, no rompe.
- [ ] Verificación visual ambos temas + Lighthouse a11y ≥ 0.90.

## Verify

- [ ] `cd scraper-api && go test ./... && go vet ./...`.
- [ ] `pnpm test` y `pnpm build` verde.
- [ ] Run end-to-end: `POST /api/audit` con URL real → response trae `woorank.score` y 16 checks.
- [ ] `openspec validate woorank-checker`.

## Archive

- [ ] Bump `openspec/specs/audit-contract/spec.md` a v0.2.0 con bloque `woorank` documentado.
- [ ] Mover `openspec/changes/woorank-checker/` a `openspec/changes/archive/woorank-checker/`.
- [ ] Actualizar `AGENTS.md` §7 con el change archivado y nueva version del contrato.
