# Tasks: competitor-compare

**Forecast LOC:** ~480 (chained PR — pasa el budget de 400 por poco).

## Plan de PRs (chained)

| PR | Slug | Forecast | Contenido |
|----|------|----------|-----------|
| 1  | `competitor-compare-engine` | ~220 | Server action, types, helpers de heatmap/keyword-gap, tests |
| 2  | `competitor-compare-ui` | ~260 | Página, form, tabla, radar, keyword gap, i18n, nav |

---

## PR 1 — Engine + tests

- [ ] `src/app/[locale]/(protected)/compare/_lib/types.ts` — `ComparisonResult`, `ComparisonEntry`.
- [ ] `src/app/[locale]/(protected)/compare/_lib/compare.ts`:
  - [ ] `normalizeUrl(input)` — lowercase host, strip trailing slash, mantener path.
  - [ ] `colorFor(value, all, direction)` — devuelve `"best" | "mid" | "worst"`.
  - [ ] `computeKeywordGap(entries)`.
  - [ ] `withTimeout(promise, ms)` helper.
  - [ ] `withSem(tasks, max)` semáforo simple.
- [ ] `src/app/[locale]/(protected)/compare/_lib/compare.test.ts`:
  - [ ] `colorFor` con valores únicos, repetidos, asc/desc.
  - [ ] `computeKeywordGap` con casos vacíos y solapamientos.
  - [ ] `normalizeUrl` casos edge (puertos, paths, query).
- [ ] `src/app/[locale]/(protected)/compare/_actions/run-comparison.ts`:
  - [ ] Validación zod.
  - [ ] Dedup + min 2 / max 4 URLs.
  - [ ] `Promise.allSettled` con timeout global 45s.
  - [ ] Mapeo a `ComparisonEntry`.
- [ ] Test integración con mock de `runFullAudit`:
  - [ ] 4 ok → 4 entries ok.
  - [ ] 3 ok + 1 error → 4 entries con 1 status error.
  - [ ] URLs duplicadas → throw `DUPLICATE_URLS`.

## PR 2 — UI

- [ ] `src/app/[locale]/(protected)/compare/page.tsx` — server component, renderiza form, muestra results si form action retorna.
- [ ] `_components/ComparisonForm.tsx` — react-hook-form + zod resolver, 1 + 3 inputs, submit a server action.
- [ ] `_components/ComparisonTabs.tsx` — Tabs shadcn con 3 paneles.
- [ ] `_components/ComparisonTable.tsx`:
  - [ ] Headers con `Badge "Tú"` en columna 1.
  - [ ] Filas por métrica (PSI×4, on-page×4, tracking×3, woorank×1, sentiment×2, top keyword×1) = 15 filas.
  - [ ] Heatmap class por celda numérica.
  - [ ] Tooltips explicando qué mide cada fila.
- [ ] `_components/ComparisonRadar.tsx` — Recharts RadarChart 6 ejes, una `Radar` por entry.
- [ ] `_components/KeywordGap.tsx` — 3 secciones (yoursOnly / shared / competitorsOnly) con `Badge` por término.
- [ ] Nav: item "Compare" en sidebar protegido.
- [ ] i18n `Compare.*` en `messages/{en,es}.json`.
- [ ] Smoke test E2E: form con 2 URLs → mock action → tabla y radar renderizados.
- [ ] Lighthouse a11y ≥ 0.90 en `/compare` en ambos temas.

## Verify

- [ ] `pnpm test` verde.
- [ ] `pnpm build` ok.
- [ ] Manual: comparar 4 dominios reales → table + radar + keyword gap coherentes.
- [ ] Manual: forzar 1 URL inalcanzable → ver columna con error y resto OK.
- [ ] `openspec validate competitor-compare`.

## Archive

- [ ] Bump `openspec/specs/dashboard-web/spec.md` con sección `Compare`.
- [ ] Mover a `openspec/changes/archive/competitor-compare/`.
- [ ] Actualizar `AGENTS.md` §7.
