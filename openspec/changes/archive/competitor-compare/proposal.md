# Proposal: competitor-compare

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Author:** @cplaza
**Created:** 2026-05-19
**Depends on:**
- [`audit-runner`](../audit-runner/) — reusa la pipeline `runFullAudit(url)`.
- [`woorank-checker`](../woorank-checker/) — opcional, si está aplicado el score viene en el comparativo.
- [`ui-foundation`](../archive/ui-foundation/) — Table, Card, Form, Tabs.

---

## ¿Por qué?

El enunciado pide **SemRush** como herramienta de análisis competitivo. SemRush:

1. Requiere API key paga (no académicamente viable).
2. Su valor es comparar tu dominio contra competidores en métricas SEO.

Podemos cubrir el **caso de uso** ("comparar contra competencia") sin la dependencia comercial: reutilizamos `POST /api/audit` ejecutándolo en paralelo contra el dominio del usuario + 1–3 competidores, y mostramos una tabla comparativa con las métricas que ya producimos (PageSpeed, on-page, tracking, keywords, sentiment, woorank).

Beneficio adicional: validamos que el contrato `audit-contract` es lo suficientemente expresivo para análisis comparativo, no solo individual.

## ¿Qué?

### Alcance (in-scope)

1. **Página nueva** `/[locale]/(protected)/compare`:
   - Form: input "Tu sitio" (URL) + hasta 3 inputs "Competidor" (URL, opcional).
   - Validación zod: al menos 2 URLs totales, todas únicas, todas absolutas http/https.
   - Submit → server action `runComparison(urls)`.

2. **Server action** `runComparison(urls: string[]): Promise<ComparisonResult>`:
   - Ejecuta `runFullAudit(url)` (PSI + scraper-api) para cada URL en paralelo via `Promise.allSettled`.
   - Timeout total 45s.
   - Si una URL falla → la incluye en el resultado con `status: "error"` y mensaje; las otras se muestran igual.
   - **Sin persistencia v1**. Cada comparación es one-shot.

3. **`ComparisonResult` shape**:
   ```ts
   interface ComparisonResult {
     ranAt: string;       // ISO
     entries: ComparisonEntry[];
   }
   interface ComparisonEntry {
     url: string;
     status: "ok" | "error";
     error?: string;
     audit?: AuditSnapshot;   // mismo shape que /audit/[snapshotId]
   }
   ```

4. **UI resultados** — componente `ComparisonTable.tsx`:
   - Filas = métricas, columnas = dominios (tu sitio primero, resaltado).
   - Métricas mostradas:
     - PageSpeed: performance / accessibility / best-practices / seo (4 filas).
     - On-page: title length score, meta description length score, h1 count, image alt coverage.
     - Tracking: ✓/✗ para GTM, GA4, Google Ads.
     - WooRank score (si disponible).
     - Sentiment polarity + score.
     - Top 3 keywords (lista compacta).
   - Cada celda con color heatmap: la mejor en verde, peor en rojo, intermedias en ámbar.
   - URL del usuario va siempre como primera columna y con `Badge "Tú"`.

5. **Tabs / vistas alternativas**:
   - Tabla principal (default).
   - Radar chart (Recharts `RadarChart`) con 6 métricas normalizadas [0,1]: PSI-performance, PSI-SEO, woorank, altCoverage, title score, meta description score.
   - Lista de keywords combinada: muestra términos donde tu dominio aparece pero competidores no, y viceversa ("keyword gap" simple).

6. **i18n**: namespace `Compare.*`:
   - `Compare.Form`, `Compare.Table`, `Compare.Radar`, `Compare.Keywords`, `Compare.Errors`.

7. **Nav**: nuevo item "Compare" en sidebar protegido después de "Audit".

### No-objetivos

- **No** API real de SemRush ni adapter para futuro.
- **No** persistencia de comparaciones (sin tabla `competitor_comparisons`).
- **No** alertas cuando un competidor mejora sus métricas (no hay histórico).
- **No** export PDF/CSV en v1 (futuro change).
- **No** ranking SERP / keyword position tracking (eso lo cubre `gsc-simulator`).
- **No** análisis de backlinks (out of scope arquitectónico).
- **No** scheduling de auditorías recurrentes a competidores.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| 4 audits en paralelo saturan scraper-api | Limit semáforo en server action: max 4 concurrent. La concurrency real depende del tier de Render. |
| Una URL lenta bloquea toda la respuesta | `Promise.allSettled` + timeout global 45s. Las que terminan se muestran, las que no → `status: "error"`. |
| Costos de PSI API (free tier 25k/día) | Cada comparación de 4 dominios consume 4 calls. Bajo riesgo en uso académico. |
| Heatmap engañoso si una sola métrica es comparable | Documentar en el UI con tooltip que el color es relativo a las URLs comparadas, no benchmarks globales. |
| Usuarios comparan dominios que no son suyos vs su sitio | Está permitido — es público scrapear. Sin restricción de ownership. |
| Sin persistencia → usuario pierde resultado al refrescar | Documentado en UI ("La comparación no se guarda. Ejecutala de nuevo si necesitás los datos"). Persistencia es futuro change. |

## Métricas de éxito

- Comparar 4 dominios en < 30s (p50).
- Tabla con heatmap legible en ambos temas.
- Radar chart con 6 ejes renderiza sin overflow en mobile (≥ 360px).
- Lighthouse a11y ≥ 0.90 en `/compare`.
- Errores parciales no rompen la vista: si 1 de 4 falla, las otras 3 se muestran.

## Referencias

- SemRush competitor research feature: https://www.semrush.com/competitive-research/ (referencia conceptual).
- Recharts RadarChart: https://recharts.org/en-US/api/RadarChart.
