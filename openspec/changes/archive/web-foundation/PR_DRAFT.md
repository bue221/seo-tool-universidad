# PR Draft — web-foundation

> Listo para copy-paste cuando `git init` + push + creación de PR estén disponibles.

## Título

```
feat(web): SEO + i18n + theme foundation [web-foundation]
```

## Body

```markdown
## Summary

- Foundation layer del `dashboard-web`: i18n bilingüe (ES default + EN), tema light/dark/system con `next-themes`, SEO técnico completo (Metadata API + JSON-LD + sitemap + robots + OG dinámico) y validación de env con `zod`.
- Cero binarios en `public/` — favicons, apple-touch-icon y OG images se generan dinámicamente con `ImageResponse`.
- Estructura `app/[locale]/` con `next-intl 4` y `localePrefix: 'as-needed'` (ES sin prefijo, EN en `/en`).
- Demo página con `LocaleSwitcher` + `ThemeToggle` segmentados y accesibles (`aria-pressed`, `aria-label` traducido).

## Spec

Spec activada: [`openspec/specs/dashboard-web/spec.md`](openspec/specs/dashboard-web/spec.md)
Histórico del change: [`openspec/changes/archive/web-foundation/`](openspec/changes/archive/web-foundation/)

## Test plan

- [ ] `pnpm install` desde la raíz de `dashboard-web/`.
- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm lint` pasa (warnings tolerables).
- [ ] `pnpm test` — 18+ specs verdes (`src/lib/metadata.test.ts` + `src/i18n/routing.test.ts`).
- [ ] `pnpm build` compila sin errors.
- [ ] `pnpm dev` — smoke manual completo según [`dashboard-web/SMOKE.md`](dashboard-web/SMOKE.md) secciones 1–5:
  - [ ] `/` muestra ES, `/en` muestra EN, `/zz` → 404.
  - [ ] LocaleSwitcher preserva pathname al cambiar.
  - [ ] ThemeToggle: light/dark/system. Recarga mantiene preferencia.
  - [ ] **Sin flash** en throttling Fast 3G + dark mode.
  - [ ] `view-source:/` contiene `<html lang="es">` + 3 hreflang (es/en/x-default) + JSON-LD Organization/WebSite.
  - [ ] `curl /robots.txt` → `Disallow: /` con `ALLOW_INDEXING=false`.
  - [ ] `curl /sitemap.xml` válido con `<xhtml:link>` hreflang.
  - [ ] `/icon`, `/apple-icon`, `/opengraph-image`, `/en/opengraph-image` sirven PNGs.
- [ ] `pnpm lighthouse` cumple thresholds (SEO ≥ 0.95, a11y ≥ 0.90).

## Riesgos

- **Dependencias frescas en el lockfile.** El primer `pnpm install` genera `pnpm-lock.yaml` que entra a este PR. Verificar que las versiones resueltas son razonables (Next 15.x, next-intl 4.x, etc.).
- **`NEXT_PUBLIC_ALLOW_INDEXING` default a `false`.** Si por error queda así en prod, Google no indexa. Toggle a `true` explícitamente al deploy de prod.
- **Tailwind 3.4 (no v4).** Decisión deliberada para compatibilidad con Shadcn/ui que viene en el próximo change. Migrar a v4 cuando Shadcn lo soporte officially.

## Out of scope (siguientes changes)

- `ui-foundation` — Shadcn/ui + paleta de componentes base.
- `auth-foundation` — Supabase SSR auth.
- `audit-runner` — consume PageSpeed + scraper-api en paralelo.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
