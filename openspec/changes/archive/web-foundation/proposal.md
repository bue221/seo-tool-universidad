# Proposal: web-foundation

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-18

---

## ¿Por qué?

`dashboard-web` aún no existe como aplicación corriendo. Antes de empezar a construir features de producto (audit runner, panel GMB simulado, gráficos de PageSpeed, etc.), necesitamos una **capa cero** estable que resuelva tres preocupaciones cross-cutting que serían carísimas de meter después:

1. **SEO técnico del dashboard mismo.** Aunque es una app autenticada, las páginas públicas (landing, login, /docs) deben ser indexables y compartibles con metadata correcta. Meter SEO al final implica rehacer layouts y server components.
2. **i18n.** El alcance académico es bilingüe (ES default + EN). Si se intenta agregar después, hay que rehacer rutas (`/[locale]/...`), mover textos hardcodeados y reescribir tests.
3. **Theme light/dark.** Shadcn/ui asume CSS variables temables desde el día 1. Agregar dark mode después implica re-pintar cada componente y arreglar contrastes uno por uno.

Los tres están acoplados:
- i18n inyecta `<link rel="alternate" hreflang="…">` en `<head>` (SEO).
- Theme requiere `<meta name="color-scheme">` y evitar flash de tema incorrecto en SSR.
- Todos viven en `app/[locale]/layout.tsx` en el mismo orden de providers.

Por eso se entregan como **un solo change**.

## ¿Qué?

### Alcance (in-scope)

1. **Estructura `app/[locale]/`** con `next-intl` v3.x.
   - Locales soportados: `es` (default), `en`.
   - Estrategia de prefijo: `as-needed` (el default ES sin prefijo, EN con `/en/...`).
   - Middleware de routing.
2. **Metadata API global** (`generateMetadata` reutilizable):
   - `title` con template (`%s | SEO Custom Tool`).
   - `description`, `keywords`, `authors`.
   - Open Graph + Twitter Card.
   - `alternates.canonical` y `alternates.languages` (hreflang).
   - `robots` (configurable por env: dev = noindex, prod = index).
3. **`robots.ts` y `sitemap.ts`** dinámicos con rutas localizadas.
4. **JSON-LD helper** (`<JsonLd schema={...}>`) para `Organization`, `WebSite`, `BreadcrumbList`.
5. **Favicons + manifest** (set completo: 16, 32, 180-apple, 192/512 maskable).
6. **Theme provider** con `next-themes`:
   - Atributo `class` sobre `<html>`.
   - System preference detection + override manual.
   - Hidratación sin flash (script bloqueante en `<head>`).
   - Toggle UI (componente `ThemeToggle`).
7. **Tailwind config** con dark mode `class` y design tokens en CSS variables (compatible con Shadcn/ui).
8. **Página `/` y `/en`** mínimas que demuestren los 3 sistemas funcionando.

### No-objetivos (out-of-scope explícito)

- **No** se construye ninguna feature de producto (audit, GMB, etc.).
- **No** se conecta Supabase aún (eso va en el próximo change `auth-foundation`).
- **No** se traduce contenido real más allá de un par de strings de demo.
- **No** se hace SEO de páginas autenticadas (esas serán `noindex` por default).
- **No** se agregan locales más allá de ES y EN (se diseña extensible, pero no se entregan).

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Flash de tema incorrecto en primer paint (FOUC) | Script bloqueante de `next-themes` en `<head>`; smoke test manual con throttling 3G. |
| Hidratación mismatch por `useTranslations` en client component | Usar `NextIntlClientProvider` envolviendo solo lo necesario; preferir `getTranslations` server-side. |
| `as-needed` rompe deep-links existentes | No hay deep-links aún (proyecto greenfield) → riesgo nulo hoy, documentar para futuro. |
| Crawlers que no parsean JSON-LD ven contenido vacío en autenticadas | Aceptado: las autenticadas son `noindex`. |
| Bundle de mensajes crece sin control | Namespaces por feature + lazy load de namespaces no críticos. |

## Métricas de éxito

- Lighthouse SEO ≥ 95 en `/` (ES) y `/en`.
- Lighthouse a11y ≥ 90 (contraste debe pasar en ambos temas).
- `view-source:` en `/` muestra `<html lang="es">` y `<link rel="alternate" hreflang="en" href="…/en">`.
- Cambiar tema y recargar mantiene la preferencia (sin flash).
- `/sitemap.xml` y `/robots.txt` responden 200 con contenido válido.

## Referencias

- Spec relacionado: [`audit-contract`](../../specs/audit-contract/spec.md) — esta foundation es prerequisito para consumirlo desde la UI.
- Stack documentado en [`AGENTS.md`](../../../AGENTS.md) y [`dashboard-web/agents.md`](../../../dashboard-web/agents.md).
