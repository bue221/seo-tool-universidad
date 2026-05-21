# Proposal: audit-intelligence-upgrade

**Domains:** `dashboard-web`, `audit-contract`, `scraper-api`
**Status:** PROPOSED
**Created:** 2026-05-20

## Why

Queremos cerrar seis gaps de producto priorizados por el usuario:

1. Confianza de datos (real vs simulado).
2. Observabilidad de auditorías.
3. Persistencia de comparaciones de competidores.
4. Formalización/fortalecimiento de `scraper-api`.
5. Recomendaciones accionables (no solo diagnóstico).
6. Robustez en sitios grandes + límite de crawl + visualización de estructura.

Además, se solicita explícitamente un **constructor de árbol visual** para mostrar estructura del sitio.

## What

### In scope

1. **Data Confidence Layer (dashboard-web)**
   - Badge explícito por módulo: `real`, `simulated`, `heuristic`.
   - Banner de disclosure en páginas con simulación (GSC/GBP).

2. **Audit Run Observability (dashboard-web + scraper-api)**
   - Trazas por etapa: `fetch`, `parse`, `tracking`, `woorank`, `persist`.
   - Códigos de error accionables y tiempos por etapa.

3. **Persisted Competitor Comparisons (dashboard-web + DB)**
   - Guardar resultados de `/compare` para histórico y tendencia.
   - Vista “Recent comparisons” en Compare.

4. **Scraper API hardening + formal spec (scraper-api)**
   - Retries con backoff para navegación/fetch auxiliares.
   - Time budgets por etapa.
   - Límites y degradación controlada en sitios grandes.

5. **Actionable Recommendations (dashboard-web)**
   - Motor de recomendaciones priorizadas por impacto/esfuerzo.
   - Backlog SEO dentro del detalle de auditoría.

6. **Site Structure Tree (scraper-api + dashboard-web)**
   - Crawl interno acotado para generar árbol visual.
   - **Límite estricto de páginas:** entre 10 y 15 en sitios grandes.
   - Hard cap: 15 URLs internas por ejecución.
   - Tab nueva en detalle de auditoría: “Structure”.

### Non-goals

- Integrar APIs privadas reales de Search Console/GA/GBP.
- Crawl masivo de dominio completo.
- Render de grafo interactivo 3D (MVP será árbol jerárquico 2D).

## Contract impact

`audit-contract` se extiende de forma aditiva con campos opcionales:

- `crawl`: métricas de crawl y límites aplicados.
- `siteStructure`: nodos/edges para render de árbol.
- `observability`: tiempos y estado por etapa.
- `recommendations`: lista de acciones priorizadas.

## Success metrics

- 100% de vistas simuladas muestran disclosure visible.
- `api/audit` devuelve breakdown de etapas con latencia por etapa.
- Comparaciones persistidas y consultables por usuario.
- Sitios grandes no exceden hard cap de 15 URLs internas.
- Estructura visual renderiza sin bloquear la UI (<200ms client render para 15 nodos).

## Risks

- Aumento de payload JSON del snapshot.
- Mayor tiempo de scraping en dominios lentos.
- Complejidad de UX en detalle de auditoría.

## Mitigations

- Campos nuevos opcionales + lazy rendering en tabs.
- Presupuesto de tiempo por etapa y fallback temprano.
- Tree MVP simple (jerarquía por path), sin layout force-directed.
