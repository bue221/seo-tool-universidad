# Spec: audit-contract

**Domain:** Contrato JSON entre `dashboard-web` y `scraper-api`.
**Status:** ACTIVE (v0.1.0)

---

## Endpoint

`POST {SCRAPER_API_URL}/api/audit`

### Request

```json
{
  "url": "https://ejemplo.com"
}
```

- `url` (string, required) — URL absoluta http/https. Debe pasar validación de URL en el servidor.

### Response 200 OK

```json
{
  "url": "https://ejemplo.com",
  "fetchedAt": "2026-05-18T10:30:00Z",
  "onPage": {
    "title":           { "value": "string", "lengthScore": 0.85 },
    "metaDescription": { "value": "string", "lengthScore": 0.70 },
    "h1":              { "count": 1, "value": "string" },
    "images":          { "total": 12, "withAlt": 9, "altCoverage": 0.75 }
  },
  "tracking": {
    "gtm":       { "detected": true,  "ids": ["GTM-XXXX"] },
    "ga4":       { "detected": true,  "ids": ["G-XXXX"] },
    "googleAds": { "detected": false, "ids": [] }
  },
  "keywords": {
    "top": [
      { "term": "string", "density": 0.038 }
    ]
  },
  "sentiment": {
    "polarity": "positive",
    "score": 0.62
  }
}
```

### Errores

| Código | Cuándo | Body |
|--------|--------|------|
| `400`  | URL inválida o ausente | `{ "error": "INVALID_URL", "message": "..." }` |
| `408`  | Timeout de Playwright (>30s) | `{ "error": "TIMEOUT", "message": "..." }` |
| `502`  | El sitio respondió con 5xx | `{ "error": "UPSTREAM_ERROR", "message": "..." }` |
| `500`  | Cualquier otro fallo interno | `{ "error": "INTERNAL", "message": "..." }` |

---

## Reglas de cálculo

### `onPage.title.lengthScore`

- Longitud óptima: 50–60 caracteres.
- `score = clamp(1 - |length - 55| / 55, 0, 1)`.

### `onPage.metaDescription.lengthScore`

- Longitud óptima: 150–160 caracteres.
- `score = clamp(1 - |length - 155| / 155, 0, 1)`.

### `onPage.images.altCoverage`

- `altCoverage = withAlt / total` (devolver `0` si `total === 0`).

### `tracking.*.detected`

- `gtm.detected = true` si el HTML contiene `googletagmanager.com/gtm.js`.
- `ga4.detected = true` si contiene patrón `G-[A-Z0-9]{6,}` en scripts o `gtag('config', 'G-...')`.
- `googleAds.detected = true` si contiene `googleads.g.doubleclick.net` o `google_ad_client`.
- Cada `ids` es deduplicado y en el orden de aparición.

### `keywords.top`

- Tokenización: lowercase, separadores no-alfanuméricos, filtro stop-words ES+EN.
- `density = count(term) / totalTokens`.
- Devolver top-5 ordenados por `density` desc.

### `sentiment.polarity`

- Heurístico basado en diccionarios de palabras positivas/negativas (ES+EN).
- `score = (positives - negatives) / max(1, positives + negatives)`, rango [-1, 1].
- `polarity`:
  - `score >= 0.2`  → `"positive"`
  - `score <= -0.2` → `"negative"`
  - resto → `"neutral"`

---

## Headers

- `Content-Type: application/json` en request y response.
- `X-Request-Id` opcional en request; se devuelve en response (eco) para trazabilidad.

## SLA (objetivo)

- p50 ≤ 6s, p95 ≤ 15s para sitios típicos.
- Timeout duro a 30s.

---

## Histórico de cambios

| Versión | Fecha       | Cambio |
|---------|-------------|--------|
| v0.1.0  | 2026-05-18  | Spec inicial. ADDED endpoint + payload completo. |
