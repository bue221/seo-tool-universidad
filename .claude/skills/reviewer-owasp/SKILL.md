---
name: reviewer-owasp
description: Auditoría proactiva de vulnerabilidades sobre el código del proyecto siguiendo la metodología de 6 fases del documento "Identificación de Vulnerabilidades" (UCentral) cruzada con OWASP Top 10. Trigger: el usuario pide revisar seguridad, "reviewer owasp", auditar vulnerabilidades, escaneo OWASP, hallar fallas de seguridad. Genera un reporte markdown priorizado por CVSS y pregunta si desea remediar.
scope: project
---

# reviewer-owasp

Auditor de seguridad **estático** del repo. Aplica la metodología de 6 fases del PDF de referencia (UCentral, Facultad de Ingeniería) y la cruza con OWASP Top 10 / CWE. Es un análisis SAST manual asistido — no ejecuta exploits ni tráfico contra hosts vivos.

## Contrato

1. Producir `security/reports/owasp-review-<YYYYMMDD-HHMM>.md` priorizado por severidad CVSS estimada.
2. Al finalizar, **preguntar al usuario si desea remediar** los hallazgos. Si dice que sí, abrir un plan de remediación (idealmente vía `/sdd-init security-remediation-<fecha>` si la feature lo amerita; si son fixes puntuales, lista de tareas inline).
3. Nunca commitear ni pushear cambios sin aprobación explícita.

## Cuándo dispararse

- "revisá seguridad", "audit owasp", "reviewer owasp", "buscá vulnerabilidades", "OWASP top 10", "fallas de seguridad".
- Antes de un release sensible.
- Tras incorporar dependencias nuevas o endpoints públicos.

## Insumo de referencia

Cargá obligatoriamente `checklist.md` (mismo directorio que este SKILL.md) — contiene la taxonomía completa de vulnerabilidades técnicas del PDF y patrones grep/AST por stack.

## Fases (del PDF, adaptadas a SAST de repo)

### Fase 1 — Reconocimiento

Mapeo del objetivo. Identificá:

- Stacks por subproyecto (`dashboard-web/package.json`, `scraper-api/go.mod`).
- Endpoints expuestos (`app/api/**`, rutas Fiber en `scraper-api`).
- Variables de entorno y secretos esperados (`.env*`, `process.env`, `os.Getenv`).
- Dependencias críticas y versiones.

Salida: bloque "Superficie de ataque" del reporte.

### Fase 2 — Escaneo y Enumeración

Listar puntos de entrada de datos no confiables:

- Handlers HTTP (params, body, query, headers, cookies).
- Lecturas de filesystem / URLs externas.
- Inputs en formularios y server actions de Next.js.
- Webhooks y callbacks.

Usar `rg` con patrones del `checklist.md`.

### Fase 3 — Escaneo de Vulnerabilidades (automatizado)

Ejecutar, si están disponibles y sin red destructiva:

- `npm audit --omit=dev` en `dashboard-web/`.
- `govulncheck ./...` en `scraper-api/` (si `govulncheck` instalado).
- `gosec ./...` si está instalado.
- `gitleaks detect --no-banner` si está instalado, para secretos.

Si una herramienta no existe, **no la instales sin preguntar**; reportala como "no ejecutada — herramienta ausente".

### Fase 4 — Análisis Manual

Por cada categoría del checklist, revisar manualmente con `read`/`rg` y razonar sobre:

- Validación de entrada (tipo, longitud, formato) en backend, no solo cliente.
- Codificación de salida (XSS Reflejado / Almacenado / DOM).
- Manejo de errores (verbose errors filtrando SQL, stack traces, paths).
- Exposición de datos sensibles (PII, tokens, archivos `.bak/.old/.env`, logs).
- Control de acceso / authz / RLS en Supabase.
- Configuración de cookies (`HttpOnly`, `Secure`, `SameSite`), CSP, HSTS.
- Uso de `dangerouslySetInnerHTML`, `eval`, `Function()`, `exec`, `os/exec`.
- SSRF en el scraper (Playwright fetches): ¿valida hostname/puerto/scheme antes de navegar?
- Inyección SQL/NoSQL en queries Supabase y Postgres directos.
- CORS y orígenes permitidos.
- Rate limiting y abuso del endpoint de scraping.

### Fase 5 — Validación y PoC

Para cada hallazgo:

- Marcar **Confirmado**, **Probable** o **Sospecha**.
- Describir PoC **conceptual** (request mínima, payload). **No ejecutar exploits**.
- Estimar CVSS v3.1 (vector y score) con justificación corta.

### Fase 6 — Informe y Priorización

Generar el reporte markdown con esta estructura exacta:

```markdown
# OWASP / UCentral Vulnerability Review — <repo> — <fecha>

## 1. Resumen ejecutivo
- Total hallazgos: N (Críticos: x, Altos: y, Medios: z, Bajos: w, Info: v)
- Top 3 riesgos
- Recomendación inmediata

## 2. Superficie de ataque
- Subproyectos, endpoints, deps, secretos esperados.

## 3. Herramientas ejecutadas
| Herramienta | Estado | Resultado resumido |

## 4. Hallazgos
### F-001 — <título corto>
- **Severidad:** Crítica | Alta | Media | Baja | Info
- **CVSS v3.1:** <score> (<vector>)
- **Categoría:** OWASP A0X:2021 / CWE-XXX / PDF §3.x
- **Estado:** Confirmado | Probable | Sospecha
- **Ubicación:** `path/file.ts:L42-L60`
- **Descripción:**
- **Impacto:**
- **PoC conceptual:**
- **Remediación sugerida:**
- **Esfuerzo estimado:** S | M | L

(repetir por hallazgo, ordenados por severidad descendente)

## 5. Limitaciones del análisis
- "Foto del momento", scope acotado, falsos positivos posibles, herramientas no ejecutadas.

## 6. Próximos pasos
- Plan de remediación propuesto.
```

## Cierre obligatorio (interacción con el usuario)

Después de escribir el reporte, mostrar al usuario:

1. Path absoluto del reporte.
2. Conteo por severidad.
3. Top 3 hallazgos en una línea cada uno.
4. **Pregunta explícita**, idéntica en intención: `¿Querés que arme un plan de remediación para estos hallazgos? (sí / solo críticos / no)`

Según la respuesta:

- **sí** → si hay ≥3 hallazgos no triviales o tocan múltiples áreas, proponer `/sdd-init security-remediation-<fecha>`; si son fixes puntuales, generar lista de tareas y empezar por el de mayor severidad, uno por commit, **sin pushear**.
- **solo críticos** → filtrar y aplicar el flujo anterior solo sobre Críticos/Altos.
- **no** → cerrar dejando el reporte como artefacto. No hacer cambios.

## Reglas duras

- Análisis **estático**, no ofensivo. Nada de tráfico contra terceros ni el propio host.
- No instalar herramientas sin preguntar.
- No modificar código en la fase de auditoría — solo lectura + escritura del reporte.
- Si un hallazgo es Sospecha sin evidencia razonable, descartalo o bajalo a Info; nada de inflar el reporte.
- El reporte va en `security/reports/` (crear dir si no existe). Agregar `security/reports/` a `.gitignore` si el usuario lo pide; por defecto **queda versionado**.
- Idioma del reporte: español rioplatense, técnico y sobrio.
