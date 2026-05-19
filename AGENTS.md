# AGENTS — seo-custom-tool

Documento raíz del monorepo. Define la **arquitectura de agentes** y el **contrato** entre ellos. Para detalles por agente:

- [`dashboard-web/agents.md`](./dashboard-web/agents.md) — Orquestador + UI + datos.
- [`scraper-api/agents.md`](./scraper-api/agents.md) — Motor de scraping + auditoría.

## 1. Visión

Herramienta de auditoría SEO que combina:

1. **Métricas oficiales de Google** sin fricción de credenciales (PageSpeed Insights público).
2. **Auditoría On-Page profunda** con scraping real (Playwright headless).
3. **Inteligencia competitiva** (densidad de keywords + sentimiento) sin depender de SemRush.
4. **Simulación estructural** de Google My Business y GA4/GTM/Ads (porque las APIs reales bloquean uso académico).

## 2. Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  Usuario (browser)                                           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  dashboard-web  (Next.js App Router + Supabase)              │
│  ─ Orquesta requests                                         │
│  ─ Llama PageSpeed Insights API (directo desde server)       │
│  ─ Llama scraper-api (POST /api/audit)                       │
│  ─ Persiste histórico en Supabase (tabla seo_snapshots)      │
└────────┬───────────────────────────────────┬─────────────────┘
         │                                   │
         ▼                                   ▼
┌────────────────────────┐         ┌────────────────────────────┐
│ Google PageSpeed API   │         │ scraper-api (Go + Fiber)   │
│ (público, free tier)   │         │ ─ Playwright headless      │
└────────────────────────┘         │ ─ WooRank check            │
                                   │ ─ GTM/GA4/Ads sniffer      │
                                   │ ─ Keyword density (SemRush)│
                                   │ ─ Sentiment heuristic      │
                                   └────────────────────────────┘
```

## 3. Contrato entre agentes

`dashboard-web` envía:

```http
POST {SCRAPER_API_URL}/api/audit
Content-Type: application/json

{ "url": "https://ejemplo.com" }
```

`scraper-api` responde:

```json
{
  "url": "https://ejemplo.com",
  "fetchedAt": "2026-05-18T10:30:00Z",
  "onPage": {
    "title": { "value": "...", "lengthScore": 0.85 },
    "metaDescription": { "value": "...", "lengthScore": 0.7 },
    "h1": { "count": 1, "value": "..." },
    "images": { "total": 12, "withAlt": 9, "altCoverage": 0.75 }
  },
  "tracking": {
    "gtm": { "detected": true, "ids": ["GTM-XXXX"] },
    "ga4": { "detected": true, "ids": ["G-XXXX"] },
    "googleAds": { "detected": false, "ids": [] }
  },
  "keywords": {
    "top": [
      { "term": "...", "density": 0.038 }
    ]
  },
  "sentiment": {
    "polarity": "positive|neutral|negative",
    "score": 0.62
  }
}
```

Este contrato es **fuente de verdad** y vive como spec en `openspec/specs/audit-contract/`. Cualquier cambio debe pasar por un OpenSpec `change` antes de tocar código.

## 4. Flujo SDD (Spec-Driven Development)

Usamos **OpenSpec** como herramienta oficial y las **skills SDD** locales como atajos:

| Fase | Skill local | Artefacto OpenSpec |
|------|-------------|--------------------|
| Iniciar feature | `/sdd-init <feature>` | `openspec/changes/<feature>/` |
| Product spec | `/sdd-prd <feature>` | `proposal.md` |
| Arquitectura | `/sdd-arch <feature>` | `design.md` |
| Plan de tareas | `/sdd-plan <feature>` | `tasks.md` |
| Review | `/sdd-review <feature>` | `validate` + archive |
| Estado | `/sdd-status <feature>` | `openspec list` |

**Regla:** ningún PR de feature se mergea sin su `openspec/changes/<feature>/` archivado en `openspec/specs/`.

## 5. Decisiones de arquitectura clave

| Decisión | Por qué |
|----------|---------|
| Monorepo híbrido (Node + Go) sin Turborepo | Cero dependencias compartidas entre stacks; el tooling de monorepo agregaría complejidad sin valor. |
| Sin Service Accounts de Google | El alcance académico no requiere paneles privados — PageSpeed público + scraping de scripts cubre el 100% del scope. |
| Playwright vs colly/goquery | Necesitamos renderizar JavaScript para SPAs y para detectar GTM/GA4 inyectados runtime. |
| Sentiment heurístico vs LLM | Heurístico local es determinista, gratis y suficiente para clasificación ternaria. |
| Supabase vs Postgres directo | Auth + RLS + Storage out-of-the-box; encaja con despliegue serverless en Vercel. |

## 6. Despliegue

- **dashboard-web:** Vercel (serverless functions para llamadas server-side).
- **scraper-api:** Render o Railway (contenedor Linux con Chromium instalado).
- **Supabase:** plan free, project ref `qjfnizfeikphlmteuuda` (ver `.mcp.json`).

## 7. Estado del proyecto

### Specs activas

| Domain | Spec | Version | Source |
|--------|------|---------|--------|
| `audit-contract` | [`openspec/specs/audit-contract/spec.md`](openspec/specs/audit-contract/spec.md) | v0.2.0 | `woorank-checker` (archived) |
| `dashboard-web` | [`openspec/specs/dashboard-web/spec.md`](openspec/specs/dashboard-web/spec.md) | v0.8.0 | + `ui-command-center` (last archived) |
| `scraper-api` | _pendiente_ | — | parcialmente cubierto vía `audit-contract` v0.2.0 |

### Changes archivados

- [`web-foundation`](openspec/changes/archive/web-foundation/) — 2026-05-18 — i18n + theme + SEO foundation para `dashboard-web`. PR draft en [`PR_DRAFT.md`](openspec/changes/archive/web-foundation/PR_DRAFT.md).
- [`ui-foundation`](openspec/changes/archive/ui-foundation/) — 2026-05-18 — Shadcn/ui (16 primitives) + lucide + sonner + react-hook-form. Migró ThemeToggle/LocaleSwitcher a ToggleGroup. PR draft en [`PR_DRAFT.md`](openspec/changes/archive/ui-foundation/PR_DRAFT.md).
- [`woorank-checker`](openspec/changes/archive/woorank-checker/) — 2026-05-19 — 16 chequeos técnicos SEO con score agregado (Go + tests). Bump `audit-contract` v0.2.0 (aditivo). UI tab "WooRank" en `/audit/[snapshotId]` con ring SVG + categorías.
- [`gsc-simulator`](openspec/changes/archive/gsc-simulator/) — 2026-05-19 — Search Console simulado: 5 rutas + generador determinista (PRNG seedable por dominio) + SVG time series/donut. Sin tablas nuevas; propiedades = `DISTINCT url` de `seo_snapshots`.
- [`competitor-compare`](openspec/changes/archive/competitor-compare/) — 2026-05-19 — Comparador on-demand de hasta 4 dominios reusando `runFullAudit`. Tabla con heatmap, radar SVG 6 ejes, keyword gap. Sin persistencia.
- [`ui-command-center`](openspec/changes/archive/ui-command-center/) — 2026-05-19 — Rediseño visual transversal "dark enterprise command center" preservando paleta lime. 3 PRs encadenados: foundation (tokens + 6 primitives nuevos), shell (Sidebar permanente + Topbar con CommandBar inline + Clerk appearance theming), pages (landing re-layout + dashboard KPI grid + audit/compare/gsc con `PageHeader` + `GradientHeading`). Supersedes `ui-polish`.

### Próximos changes propuestos

Ningún change propuesto pendiente que afecte el enunciado académico — los tres bloques nuevos están archivados. Changes históricos sin aplicar (no bloquean el alcance): `auth-foundation`, `audit-runner`, `scraper-foundation`, `gbp-simulator`, `analytics-dashboard`.
