# Agente: SEO Scraper & Analytics Engine (Go + Playwright)

Este componente actúa como el **Extractor de Inteligencia Competitiva y Auditor Técnico**. Está diseñado en Go para ser ultra veloz y ejecutar procesos de renderizado de JavaScript, detección de herramientas de marketing (Google Ads, GTM, GA4) y análisis lingüístico básico de la competencia.

## 1. Módulos y Responsabilidades (Estrategia de Solución Simple)

### A. Auditoría On-Page Tipo "WooRank"
*   **Solución Simple:** Utiliza Playwright-Go para abrir Chromium en modo headless, inspeccionar el DOM y evaluar la presencia de etiquetas `<title>`, `meta-description`, jerarquía de `<h1>` y accesibilidad de imágenes (`alt`).

### B. Detector de Suite Google (GA4, GTM, Google Ads)
*   **Solución Simple:** En lugar de conectarse a los paneles privados de las herramientas de Google del cliente (que requeriría permisos de administración), el agente analiza el código fuente de la página web para **detectar si tiene instalados los scripts de rastreo**.
*   **Validación:** Busca patrones como `googletagmanager.com/gtm.js`, `googleanalytics` o `google_ad_client`. Reporta al frontend si la configuración de GTM, Analytics v4 y Ads está activa.

### C. Analizador de Mercado y Palabras Clave Tipo "SemRush"
*   **Solución Simple:** Extrae todo el texto plano visible de la página web, limpia los conectores léxicos (stop-words en español/inglés) y calcula un mapa de **densidad de palabras clave**. Devuelve las 5 keywords más potentes por las que compite la página.

### D. Motor de Análisis de Sentimiento
*   **Solución Simple:** Analiza el texto de las etiquetas principales (`h1`, `h2`, párrafos destacados) o textos de reviews extraídos mediante un algoritmo heurístico local basado en diccionarios de palabras clave (o una llamada ligera a un modelo de lenguaje). Clasifica la intención del contenido de la competencia en: *Positivo, Neutral o Negativo*.

## 2. Flujo de Trabajo (Workflow)
1. Escucha en el endpoint `POST /api/audit`.
2. Playwright abre la URL y renderiza el sitio por completo (soportando aplicaciones de JavaScript).
3. Ejecuta en paralelo cuatro sub-procesos:
    *   Raspa etiquetas SEO (WooRank).
    *   Escanea el HTML en busca de IDs de GTM/GA4/Ads.
    *   Tokeniza el texto para extraer la densidad de palabras clave (SemRush).
    *   Evalúa la polaridad del texto (Análisis de Sentimiento).
4. Cierra el navegador de forma segura para liberar RAM.
5. Retorna un objeto JSON estructurado con todos los módulos resueltos al frontend de Next.js.

## 3. Stack Tecnológico
*   **Lenguaje:** Go (Golang)
*   **Framework HTTP:** Fiber
*   **Navegador:** Playwright-Go (Chromium Headless)
*   **Despliegue:** Render / Railway (Entorno Linux Nativo)
