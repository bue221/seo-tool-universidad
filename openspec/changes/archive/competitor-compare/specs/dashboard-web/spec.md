# Delta dashboard-web: competitor-compare

**Target spec:** `openspec/specs/dashboard-web/spec.md`
**Operación:** ADD

---

## ADDED — Sección "Compare"

### Route

```
/[locale]/compare        (protected)
```

### Capacidad

- Form con 1 URL primaria (la del usuario) + 1 a 3 URLs de competidores.
- Server action `runComparison(input)` ejecuta `runFullAudit` para cada URL en paralelo (max 4 concurrent, timeout global 45s, timeout individual 30s) usando `Promise.allSettled`.
- **Sin persistencia**: cada comparación es one-shot.

### Validaciones

- Mínimo 2 URLs únicas, máximo 4.
- Todas las URLs deben ser absolutas `http://` o `https://`.
- Duplicados (después de normalizar) → error `DUPLICATE_URLS`.

### Resultados

Tabs disponibles:

1. **Table** — métricas en filas, dominios en columnas, heatmap relativo a las URLs comparadas (best/mid/worst). 15 filas:
   - PSI (4): performance, accessibility, best-practices, seo.
   - On-page (4): title length score, meta description length score, h1 count, image alt coverage.
   - Tracking (3): gtm/ga4/googleAds detectado (booleano).
   - WooRank score (1, si disponible).
   - Sentiment (2): polarity + score.
   - Top keyword (1).

2. **Radar** — RadarChart con 6 ejes normalizados [0,1]: PSI performance, PSI SEO, woorank score, alt coverage, title score, meta description score.

3. **Keyword gap** — diff de `keywords.top` entre tu sitio y la unión de competidores: `yoursOnly`, `shared`, `competitorsOnly`.

### Manejo de errores

- Audit individual falla → la columna muestra estado de error pero las demás columnas se renderizan normalmente.
- Si todas fallan → empty state con botón "Reintentar".

### i18n

Namespaces en `messages/{en,es}.json`:

- `Compare.Form`
- `Compare.Table`
- `Compare.Radar`
- `Compare.Keywords`
- `Compare.Errors`

### Nav

Nuevo item "Compare" en sidebar protegido inmediatamente después de "Audit".

### Out-of-scope

- Sin tabla Supabase para histórico de comparaciones.
- Sin scheduling / cron jobs de comparación recurrente.
- Sin export PDF/CSV.
- Sin análisis de backlinks ni ranking SERP.
- Sin integración con SemRush u otras APIs comerciales.
