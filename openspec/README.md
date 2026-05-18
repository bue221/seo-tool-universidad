# OpenSpec — seo-custom-tool

Esta carpeta contiene las **specs source-of-truth** del proyecto y las **propuestas de cambio** en flight.

## Estructura

```
openspec/
├── specs/                              # Specs aprobadas (verdad oficial)
│   ├── audit-contract/spec.md          # Contrato JSON dashboard-web ↔ scraper-api
│   └── dashboard-web/spec.md           # ✅ ACTIVE — desde web-foundation (2026-05-18)
├── changes/                            # Cambios en propuesta / WIP
│   ├── archive/                        # Changes históricos (preserva proposal+design+tasks)
│   │   └── web-foundation/
│   │       ├── proposal.md
│   │       ├── design.md
│   │       ├── tasks.md
│   │       ├── PR_DRAFT.md             # PR body listo para copy-paste
│   │       └── specs/dashboard-web/spec.md  # delta original (banner ARCHIVED)
│   └── <slug>/                         # WIP, mismo shape que archive items
├── config.yaml
└── README.md
```

## Flujo SDD con OpenSpec

1. **Init feature** → `/sdd-init <feature>` (skill) ó `openspec change new <feature>`.
2. **PRD** → `/sdd-prd <feature>` → escribe `changes/<feature>/proposal.md`.
3. **Arch** → `/sdd-arch <feature>` → escribe `changes/<feature>/design.md`.
4. **Plan** → `/sdd-plan <feature>` → escribe `changes/<feature>/tasks.md`.
5. **Implementar** → marcar checkboxes de `tasks.md` mientras se programa.
6. **Review** → `/sdd-review <feature>` → `openspec validate <feature>`.
7. **Archive** → `openspec archive <feature>` → mueve los deltas a `specs/`.

> Si no tienes el CLI de OpenSpec instalado (registry corporativo), las skills
> SDD locales replican el flujo y respetan esta misma estructura. Cuando puedas
> instalar `openspec` (`npx -y @fission-ai/openspec init`) la herramienta lo
> reconocerá tal cual.

## Por qué OpenSpec

- **Specs como contratos versionables** — viven en Git, se revisan en PR.
- **Deltas explícitos** (ADDED/MODIFIED/REMOVED) — review enfocado en el cambio.
- **Compatible con múltiples agentes** (Claude Code, Cursor, etc).

## Specs activas

| Domain | Versión | Source |
|--------|---------|--------|
| [`audit-contract`](specs/audit-contract/spec.md) | v0.1.0 | Inicial |
| [`dashboard-web`](specs/dashboard-web/spec.md) | v0.2.0 | [`changes/archive/web-foundation/`](changes/archive/web-foundation/) + [`changes/archive/ui-foundation/`](changes/archive/ui-foundation/) |

## Changes archivados

| Slug | Fecha | Dominio afectado | Tipo |
|------|-------|------------------|------|
| [`web-foundation`](changes/archive/web-foundation/) | 2026-05-18 | `dashboard-web` | ADDED |
| [`ui-foundation`](changes/archive/ui-foundation/) | 2026-05-18 | `dashboard-web` | ADDED + MODIFIED |
