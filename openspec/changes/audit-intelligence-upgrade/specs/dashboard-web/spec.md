# Delta dashboard-web: audit-intelligence-upgrade

**Target spec:** `openspec/specs/dashboard-web/spec.md`
**Operation:** ADD

## ADDED — Data confidence UX

- Badge por módulo: `Real`, `Simulated`, `Heuristic`.
- Banner de disclosure en secciones simuladas (GSC/GBP).

## ADDED — Audit detail extensions

Rutas existentes de detalle incorporan nuevas tabs:

- `Recommendations`
- `Structure`
- `Observability`

## ADDED — Site structure visualization

- Render de árbol jerárquico desde `result.scraper.siteStructure`.
- Fallback explícito cuando no hay nodos.

## ADDED — Compare persistence

- `/compare` persiste resultados de ejecuciones exitosas.
- Lista de comparaciones recientes por usuario.

## Invariants

- Tabs nuevas no deben romper snapshots históricos (campos opcionales).
- Disclosure simulado debe ser visible sin interacción.
- Tree rendering debe tolerar payload truncado (`crawl.truncated=true`).
