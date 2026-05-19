# Agente: Dashboard Web (Next.js + Supabase)

Este componente actúa como el **Orquestador Central, Gestor de Datos y Analista de Rendimiento Oficial**. Su rol es interactuar con el usuario, administrar el estado global del negocio y consumir métricas de rendimiento reales de Google sin fricción de credenciales.

## 0. Foundation Layer (activa — `web-foundation`)

Capa fundacional que soporta a todos los módulos del agente. Detalles completos en
[`../openspec/changes/web-foundation/`](../openspec/changes/web-foundation/) y
[`README.md`](./README.md).

| Capacidad | Implementación | Archivos clave |
|-----------|----------------|----------------|
| **i18n bilingüe ES/EN** | `next-intl 4` con `localePrefix: 'as-needed'`. Server (`getTranslations`) y client (`useTranslations`). hreflang automático. | `src/i18n/{routing,request,navigation}.ts`, `src/middleware.ts`, `messages/{es,en}.json` |
| **Theme light/dark/system** | `next-themes` + Tailwind `darkMode: 'class'` + tokens HSL en `:root`/`.dark`. Sin FOUC (script bloqueante de next-themes). | `src/components/theme/*.tsx`, `src/styles/globals.css`, `tailwind.config.ts` |
| **SEO técnico** | Next.js Metadata API + `buildMetadata` helper. hreflang + x-default. Robots + sitemap + JSON-LD. OG images dinámicas vía `ImageResponse`. | `src/lib/metadata.ts`, `src/components/seo/JsonLd.tsx`, `src/app/{robots,sitemap,manifest,icon,apple-icon}.ts`, `src/app/[locale]/opengraph-image.tsx` |
| **Validación de env** | `zod` al startup — falla `pnpm build` si falta una `NEXT_PUBLIC_*`. | `src/lib/env.ts`, `.env.local.example` |
| **PWA básico** | Manifest + iconos generados con `ImageResponse` (cero binarios en el repo). | `src/app/manifest.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx` |
| **UI System (Shadcn)** | 16 primitives Shadcn (Button, Input, Card, Dialog, Sheet, Tooltip, DropdownMenu, Toggle/ToggleGroup, Tabs, Separator, Skeleton, Badge, Form, Sonner) sobre Radix. `cn()` helper + cva variants + tailwindcss-animate. | `src/components/ui/*.tsx`, `src/lib/utils.ts`, `components.json`, `tailwind.config.ts` |
| **Iconos** | `lucide-react` tree-shakeable. | `import { Sun } from 'lucide-react'` |
| **Toasts** | `sonner` integrado con `next-themes` (light/dark sync automático). | `src/components/ui/sonner.tsx` montado en layout |
| **Forms** | `react-hook-form` + `zodResolver` vía `Form` component de Shadcn. | `src/components/ui/form.tsx` |
| **Demo funcional** | Home con `LocaleSwitcher` (ToggleGroup) + `ThemeToggle` (ToggleGroup) + CTAs (Button) + Card con stats. | `src/app/[locale]/page.tsx`, `src/components/i18n/LocaleSwitcher.tsx`, `src/components/theme/ThemeToggle.tsx` |

**Invariantes que esta capa garantiza** (cualquier módulo nuevo debe respetarlos):

1. **Sin strings hardcoded en JSX** — todo pasa por `t(...)`.
2. **Sin colores fijos en clases Tailwind** — usar tokens (`bg-background`, `text-muted-foreground`, etc.) para que el theme funcione.
3. **Toda página pública exporta `generateMetadata`** vía `buildMetadata` para asegurar hreflang correcto.
4. **`setRequestLocale(locale)` antes de cualquier hook de next-intl** en server components — sin esto, la página se vuelve dinámica.
5. **Rutas no localizadas (API, etc.) viven fuera de `[locale]/`** y deben excluirse del matcher del middleware si requieren acceso sin redirect.
6. **No reescribir primitives UI** (`Button`, `Input`, `Card`, etc.) por feature — usar `@/components/ui/*`. Si una variante no existe, extenderla con `cva`, no clonar.
7. **Iconos via `lucide-react`** — no SVG inline en componentes nuevos.
8. **Toasts via `sonner`** — no escribir un sistema de notificaciones ad-hoc. Importar `toast` desde `sonner`.
9. **Forms con `react-hook-form` + `zod`** — usar `Form`/`FormField`/`FormControl`/`FormMessage` de `@/components/ui/form`, no `useState` manual.
10. **Estilos con `cn()` helper** — para componer clases condicionales y resolver conflictos Tailwind. Nunca concatenar strings de clases a mano.

## 1. Módulos y Responsabilidades (Estrategia de Solución Simple)

### A. Módulo Google Insights & SEO Móvil (PageSpeed Insights API)
*   **Solución Simple:** En lugar de configurar Cuentas de Servicio complejas, este agente hace un `fetch` directo a la API pública de **Google PageSpeed Insights**.
*   **Datos obtenidos:** Trae en tiempo real los puntajes oficiales de Google sobre rendimiento, accesibilidad, mejores prácticas y SEO móvil de la URL analizada.

### B. Módulo Google My Business & Local SEO (Simulación Estructural)
*   **Solución Simple:** Dado que la API real requiere verificación de empresas físicas reales, este agente expone un panel de gestión conectado a Supabase que replica la estructura exacta de Google My Business.
*   **Datos gestionados:** Permite al usuario simular la optimización de su ficha local (Horarios, publicaciones, gestión de reseñas y cálculo del impacto de keywords locales).

### C. Consumidor del Motor en Go
*   Envía las solicitudes de auditoría profunda al componente de Go y recibe el reporte consolidado de competencia, analítica instalada y sentimiento.

## 2. Flujo de Trabajo (Workflow)
1. El usuario solicita el análisis de un sitio web desde la interfaz.
2. Next.js dispara una consulta paralela:
    *   **Hacia Google:** Llama a la API de PageSpeed para traer las métricas de carga e Insights.
    *   **Hacia Go:** Llama al microservicio de scraping para la auditoría On-Page y detección de scripts.
3. Next.js unifica ambos resultados, calcula un Score global ponderado y guarda el histórico en la tabla `seo_snapshots` de Supabase.

## 3. Stack Tecnológico
*   **Framework:** Next.js 15 (App Router) + React 19
*   **i18n:** next-intl 4
*   **Theme:** next-themes 0.4 + Tailwind 3.4 `darkMode: 'class'`
*   **Env validation:** zod 3
*   **Base de Datos y Auth:** Supabase (PostgreSQL) — SSR auth en progreso (`auth-foundation`).
*   **Componentes de UI:** Tailwind CSS + Shadcn/ui + Recharts — *Shadcn pendiente del change `ui-foundation`*
*   **Despliegue:** Vercel (Serverless)

## 4. Roadmap de capacidades

| Change | Estado | Qué agrega |
|--------|--------|------------|
| `web-foundation` | ✅ Archivado (2026-05-18) | i18n + theme + SEO + env + PWA básica |
| `ui-foundation` | ✅ Código completo, smoke pendiente de `pnpm install` | Shadcn/ui (16 primitives) + lucide + sonner + react-hook-form + cva |
| `auth-foundation` | 🚧 En progreso | Supabase client + SSR auth + login + protected routes |
| `audit-runner` | 🚧 En progreso | Página que consume PageSpeed API + scraper-api en paralelo (ver [`../openspec/specs/audit-contract/spec.md`](../openspec/specs/audit-contract/spec.md)) |
| `gbp-simulator` | 🚧 En progreso | Panel My Business simulado contra Supabase |
| `analytics-dashboard` | 🚧 En progreso | Gráficos/KPIs con histórico de `seo_snapshots` |
