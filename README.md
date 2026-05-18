# seo-custom-tool

Herramienta de auditoría SEO con arquitectura de monorepo híbrido.

> Para el detalle de la arquitectura de agentes, leer [`AGENTS.md`](./AGENTS.md).
> Para el flujo SDD/OpenSpec, leer [`openspec/README.md`](./openspec/README.md).

## Estructura

```
seo-custom-tool/
├── AGENTS.md                 # Arquitectura de agentes (raíz)
├── README.md                 # Este archivo
├── .mcp.json                 # Config de MCP servers (Supabase)
├── .claude/                  # Config local de Claude Code
│
├── dashboard-web/            # Agente 1: Orquestador + UI (Next.js + Supabase)
│   ├── agents.md
│   ├── package.json
│   └── README.md
│
├── scraper-api/              # Agente 2: Motor de scraping (Go + Playwright)
│   ├── agents.md
│   ├── go.mod
│   └── README.md
│
└── openspec/                 # Spec-Driven Development source-of-truth
    ├── specs/                # Specs aprobadas
    │   └── audit-contract/
    ├── changes/              # Cambios en flight
    ├── config.yaml
    └── README.md
```

## Quick start

```bash
# 1. Frontend
cd dashboard-web
# (cuando vayas a inicializar Next.js, ver dashboard-web/README.md)

# 2. Scraper
cd scraper-api
# (cuando vayas a inicializar Go, ver scraper-api/README.md)

# 3. Nueva feature (flujo SDD)
/sdd-init <nombre-feature>
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend / Orquestador | Next.js (App Router), Tailwind, Shadcn/ui, Recharts |
| BD + Auth | Supabase (Postgres + RLS) |
| Scraper | Go (Fiber + Playwright-Go + Chromium headless) |
| APIs externas | Google PageSpeed Insights (público) |
| Specs | OpenSpec + skills SDD locales |
| Despliegue | Vercel (frontend) + Render/Railway (scraper) |

## Cumplimiento del alcance académico

- **Google Analytics / GTM / Ads** → detectados por scraper en código fuente, dashboard los muestra con estructura GA4.
- **Google Insights** → API real de PageSpeed (datos oficiales).
- **My Business** → módulo simulado con estructura idéntica a la real.
- **SemRush** → densidad de keywords calculada localmente.
- **Sentimiento** → heurístico sobre el contenido scrapeado.

Detalle del razonamiento en [`AGENTS.md`](./AGENTS.md).

## Notas operativas

- **MCP Supabase** está deshabilitado en `.claude/settings.local.json`. Habilitarlo manualmente cuando se vaya a trabajar con el esquema (cambiar `disabledMcpjsonServers` → `enabledMcpjsonServers`).
- **OpenSpec CLI** no se pudo instalar por restricciones del registry corporativo; la carpeta `openspec/` está creada a mano siguiendo la convención oficial. Cuando haya red, `npx -y @fission-ai/openspec update` sincroniza.
