# Smoke tests — web-foundation

Lista de verificación manual a correr después del primer `pnpm install`
exitoso. Cubre las invariantes que esta foundation declara en `agents.md`.

## Pre-requisitos

```bash
cd dashboard-web
cp .env.local.example .env.local
pnpm install
```

## 1. Build + typecheck + lint

```bash
pnpm typecheck   # debe pasar sin errores
pnpm lint        # debe pasar (warnings tolerables)
pnpm build       # debe terminar sin errors; verifica zod env validation
```

**Esperado:** `pnpm build` muestra al menos las rutas estáticas pre-generadas:
- `/` (es)
- `/en` (en)
- `/robots.txt`
- `/sitemap.xml`
- `/manifest.webmanifest`
- `/icon` (PNG generado)
- `/apple-icon` (PNG generado)
- `/[locale]/opengraph-image` (PNG generado)
- `/[locale]/twitter-image` (PNG generado)

## 2. Tests unitarios

```bash
pnpm test
```

**Esperado:**
- `src/lib/metadata.test.ts` — todos los specs verdes.
- `src/i18n/routing.test.ts` — todos los specs verdes.
- `src/lib/utils.test.ts` — todos los specs verdes (cn helper).

## 3. i18n (routing + traducciones)

```bash
pnpm dev
```

| URL | Esperado |
|-----|----------|
| `http://localhost:3000/` | H1 en español, `<html lang="es">` |
| `http://localhost:3000/en` | H1 en inglés, `<html lang="en">` |
| `http://localhost:3000/es` | Redirect 308 a `/` (canonical sin prefijo en default locale) |
| `http://localhost:3000/zz` | 404 con copy de NotFound |
| `http://localhost:3000/zz/foo` | 404 |

**Test del LocaleSwitcher:**
1. En `/` clickear botón "EN" → URL cambia a `/en` sin perder scroll.
2. En `/en` clickear "ES" → URL vuelve a `/`.

## 4. Theme

| Acción | Esperado |
|--------|----------|
| Click en ☀ (light) | `<html>` pierde clase `dark`, fondo blanco. |
| Click en 🌙 (dark) | `<html>` gana clase `dark`, fondo oscuro. |
| Click en 🖥 (system) | Se aplica según `prefers-color-scheme` del OS. |
| Recargar la página | La preferencia persiste (localStorage `theme`). |
| Throttling "Fast 3G" en DevTools + dark mode | **Sin flash** de tema light en primer paint. |

### 4.1 A11y de Toggles migrados (ui-foundation)

| Acción | Esperado |
|--------|----------|
| Tab desde URL bar | Foco entra al LocaleSwitcher en el item activo. |
| Flecha izq/der dentro del LocaleSwitcher | Cambia de ítem (ES ↔ EN) sin tocar foco con Tab. |
| Tab desde LocaleSwitcher | Foco salta al ThemeToggle (en el item activo). |
| Flecha izq/der dentro del ThemeToggle | Cambia entre Light/Dark/System. |
| Enter o Space sobre item enfocado | Activa el toggle. |
| VoiceOver/NVDA | Anuncia "Tema, [Sol\|Luna\|Sistema], pressed" y similar para locale. |

## 4.2 UI primitives (smoke visual)

| Componente | Cómo probar |
|------------|-------------|
| `Button` | Visible en home: "Iniciar auditoría" (default), "Ver documentación" (outline). Hover cambia opacidad. |
| `Card` | Visible en home con `web-foundation · ui-foundation` title + grid de stats. Border y shadow correctos. |
| `Separator` | Línea vertical entre LocaleSwitcher y ThemeToggle en el header. |
| `Toaster` | Agregar temporalmente `<Button onClick={() => toast('test')}>` y verificar que el toast aparezca abajo-derecha con tema correcto. |

## 5. SEO

### 5.1 hreflang

```bash
curl -s http://localhost:3000/ | grep 'hreflang'
# Esperado: 3 entradas (es, en, x-default)
```

### 5.2 JSON-LD

```bash
curl -s http://localhost:3000/ | grep -A2 'application/ld+json'
# Esperado: schemas Organization y WebSite
```

### 5.3 Metadata

```bash
curl -s http://localhost:3000/ | grep -E 'og:|twitter:|description'
# Esperado: og:title, og:description, og:url, twitter:card=summary_large_image
```

### 5.4 robots.txt

```bash
# Con NEXT_PUBLIC_ALLOW_INDEXING=false (default):
curl http://localhost:3000/robots.txt
# Esperado:
#   User-Agent: *
#   Disallow: /

# Cambiar a true en .env.local, reiniciar:
NEXT_PUBLIC_ALLOW_INDEXING=true pnpm dev
curl http://localhost:3000/robots.txt
# Esperado:
#   User-Agent: *
#   Allow: /
#   Sitemap: ...
#   Host: ...
```

### 5.5 sitemap.xml

```bash
curl http://localhost:3000/sitemap.xml
# Esperado: XML válido con <url> para /, con <xhtml:link rel="alternate" hreflang="es"|"en">
```

### 5.6 Imágenes dinámicas

Abrir en el browser y verificar que se sirven como PNG:
- `http://localhost:3000/icon` → 32x32 con "S" sobre fondo dark.
- `http://localhost:3000/apple-icon` → 180x180 maskable.
- `http://localhost:3000/opengraph-image` → 1200x630 con copy ES.
- `http://localhost:3000/en/opengraph-image` → 1200x630 con copy EN.

### 5.7 Manifest

```bash
curl http://localhost:3000/manifest.webmanifest | jq .
# Esperado: JSON válido con name, short_name, theme_color, icons.
```

## 6. Lighthouse

```bash
pnpm build
pnpm lighthouse
```

**Thresholds (`.lighthouserc.json`):**
- SEO ≥ 0.95 (error si menor).
- Accessibility ≥ 0.90 (error si menor).
- Best practices ≥ 0.90 (warn).
- Performance ≥ 0.80 (warn).

Si SEO o a11y caen bajo threshold, **el comando falla** y bloquea el merge en CI.

## 7. Validadores externos (opcional, pero recomendado)

Una vez deployado a un dominio accesible públicamente:

- [Twitter Card Validator](https://cards-dev.twitter.com/validator) — pegar URL.
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) — pegar URL.
- [Google Rich Results Test](https://search.google.com/test/rich-results) — verificar JSON-LD.
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly).

## 8. Audit runner smoke

- Abrir `/audit` autenticado.
- Probar URL válida y confirmar redirección a `/audit/[snapshotId]`.
- Validar vista con tabs y score.
- Forzar caída de `SCRAPER_API_URL` y verificar resultado parcial.

## 9. Auth foundation smoke

Con env Supabase cargado en `.env.local`:

- Abrir `/dashboard` sin sesión → redirect a `/login`.
- Signup en `/signup` con usuario nuevo.
- Login en `/login` y acceso a `/dashboard`.
- Ejecutar sign out desde `UserMenu`.
- Validar que `public.profiles` tenga fila por usuario (trigger `handle_new_user`).

## Criterio de "smoke pasa"

Si las secciones **1–5** pasan, la foundation está saludable. Lighthouse (sección 6), validadores externos (sección 7) y auth smoke (sección 8) completan la verificación pre-archive.
