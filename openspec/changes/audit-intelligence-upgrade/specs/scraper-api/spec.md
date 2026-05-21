# Delta scraper-api: audit-intelligence-upgrade

**Target spec:** `openspec/specs/scraper-api/spec.md` (pending bootstrap)
**Operation:** ADD

## ADDED — Bounded internal crawl for structure

- Crawl interno same-host para construir árbol del sitio.
- BFS con `maxDepth=2`.
- Hard cap de páginas: `maxPages <= 15` (mínimo configurable 10).
- Si se alcanza límite o budget, devolver parcial con `crawl.truncated=true`.

## ADDED — Stage observability

- Registrar duración y estado de etapas del pipeline.
- Incluir `observability` en respuesta de auditoría.

## ADDED — Resilience and degradation

- Retries acotados con backoff para navegación/fetch auxiliar.
- Time budgets por etapa para evitar timeout total innecesario.
- Degradación parcial antes de error global cuando sea posible.

## ADDED — Recommendation payload

- Generación determinista de recomendaciones accionables en base a findings.
- Campo opcional `recommendations` en respuesta.
