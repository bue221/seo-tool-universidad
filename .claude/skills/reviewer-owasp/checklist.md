# Checklist OWASP × UCentral

Taxonomía operativa para `reviewer-owasp`. Fuente: PDF *Identificación de Vulnerabilidades: Estrategias y Metodologías para la Ciberseguridad Proactiva* (UCentral) + OWASP Top 10 2021 + CWE.

Cada bloque incluye: descripción, mapeo (OWASP/CWE/PDF §), señales `rg` recomendadas para este monorepo (Next.js + Go/Fiber + Supabase + Playwright), y mitigación.

---

## 1. Entradas inseguras y validación deficiente — PDF §3.1

OWASP: A03:2021 Injection · CWE-20, CWE-89, CWE-78, CWE-94.

**Señales:**

```bash
rg -n "req\.(query|body|params)" dashboard-web/
rg -n "c\.(Query|Params|Body|FormValue|BodyParser)" scraper-api/
rg -n "(exec|execSync|spawn)\(" dashboard-web/
rg -n "os/exec|exec\.Command" scraper-api/
rg -n "raw\(|\$queryRaw|\.query\(" dashboard-web/
rg -n "fmt\.Sprintf\(.*SELECT|INSERT|UPDATE|DELETE" scraper-api/
```

**Buscar:** concatenación de input en SQL, comandos shell con input del usuario, validación solo en cliente (`useForm` sin validar igual en server action / API route), ausencia de `zod`/`valibot` en endpoints, falta de validación de tipos en handlers Fiber.

**Mitigación:** validación server-side con esquemas (zod/valibot/go-playground/validator), parámetros preparados, allowlist de caracteres, límites de longitud.

---

## 2. Cross-Site Scripting (XSS) — PDF §3.2

OWASP: A03:2021 · CWE-79.

**Variantes:**

- **Reflejado:** input vuelve sin codificar en la respuesta (querystring → HTML).
- **Almacenado:** input persiste en DB y se renderiza luego.
- **DOM:** sinks en cliente (`innerHTML`, `document.write`, `location.href`).

**Señales:**

```bash
rg -n "dangerouslySetInnerHTML" dashboard-web/
rg -n "innerHTML\s*=" dashboard-web/
rg -n "document\.write\(" dashboard-web/
rg -n "eval\(|new Function\(" dashboard-web/
rg -n "v-html|{@html" dashboard-web/   # por si hay Svelte/Vue
rg -n "c\.SendString\(.*req|fmt\.Fprintf\(w" scraper-api/
```

**Mitigación:** output encoding por defecto de React/Next (no romperlo), `DOMPurify` para HTML libre, CSP estricta (`Content-Security-Policy`), cookies con `HttpOnly`+`Secure`+`SameSite=Lax|Strict`, evitar pasar HTML del scraper al cliente sin sanitizar.

---

## 3. Exposición de datos confidenciales — PDF §3.3

OWASP: A02:2021 Cryptographic Failures, A01:2021 Broken Access Control · CWE-200, CWE-538, CWE-798.

**Señales:**

```bash
# Secretos en repo
rg -nE "(api[_-]?key|secret|token|password|bearer)\s*[:=]\s*['\"][A-Za-z0-9_\-]{16,}" \
   --glob '!**/node_modules' --glob '!**/.next' --glob '!*.lock'
rg -n "SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY" dashboard-web/
rg -n "console\.log\(.*(token|secret|password|email)" dashboard-web/
rg -n "log\.(Print|Info|Debug)\(.*(token|secret|password)" scraper-api/

# Archivos peligrosos versionados
git ls-files | rg -E "\.(env|env\.local|bak|old|pem|key|p12|sql)$"
```

**Buscar:** service-role key de Supabase usada en client components, secretos hardcoded, PII en logs, respuestas API que devuelven más campos de los necesarios, falta de TLS forzado (HSTS), archivos `.bak`/`.old`/`.env` en disco o en respuestas estáticas.

**Mitigación:** TLS + HSTS, `next.config` con headers de seguridad, RLS en Supabase, `select` explícito en queries, scrubbing de logs, escaneo de secretos en CI (gitleaks, trufflehog).

---

## 4. Errores detallados / Verbose errors — PDF §3.4

OWASP: A05:2021 Security Misconfiguration · CWE-209, CWE-754.

**Señales:**

```bash
rg -n "err\.stack|error\.stack" dashboard-web/
rg -n "JSON\.stringify\(err" dashboard-web/
rg -n "c\.Status\(\d+\)\.SendString\(err\.Error\(\)\)" scraper-api/
rg -n "fmt\.Errorf\(.*%v.*err" scraper-api/
rg -n "NODE_ENV.*development" dashboard-web/
```

**Buscar:** stack traces devueltos al cliente, mensajes que filtran SQL, paths del filesystem, versiones de librerías, `debug: true` en producción, Next.js en dev mode expuesto, páginas 500 con detalles.

**Mitigación:** handler de error global que devuelva un id de correlación y mensaje genérico al cliente; el detalle solo en logs server-side.

---

## 5. Broken Access Control / Authz

OWASP: A01:2021 · CWE-285, CWE-639 (IDOR).

**Señales:**

```bash
rg -n "createClient\(.*SERVICE_ROLE" dashboard-web/
rg -n "auth\.uid\(\)|auth\.role\(\)" supabase/
rg -n "params\.id|params\.userId" dashboard-web/app/api/
rg -n "middleware" dashboard-web/
```

**Buscar:** endpoints que aceptan `userId` por param y no verifican que coincida con la sesión, ausencia de RLS en tablas Supabase, rutas `/api/**` sin chequeo de auth, admin endpoints sin role check.

---

## 6. SSRF — específico del scraper

OWASP: A10:2021 · CWE-918.

**Señales:**

```bash
rg -n "page\.Goto|chromedp\.Navigate|http\.Get|http\.NewRequest" scraper-api/
rg -n "url\s*:=" scraper-api/
```

**Buscar:** el endpoint `/api/audit` recibe una URL del cliente y la navega con Playwright. Verificar:

- Se rechaza `file://`, `ftp://`, `gopher://`, `data:`.
- Se resuelve DNS y se rechaza IPs privadas (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, ::1, fc00::/7).
- Hay timeout y límite de tamaño de respuesta.
- No se siguen redirects a hosts internos sin re-validar.

**Mitigación:** allowlist de schemes, validación de IP resuelta antes de navegar, proxy egress con filtro.

---

## 7. Dependencias vulnerables — A06:2021

```bash
cd dashboard-web && npm audit --omit=dev --json | head -200
cd scraper-api && govulncheck ./... 2>&1 | head -200
```

Listar paquetes con CVE conocido y versión segura sugerida.

---

## 8. Configuración de seguridad

OWASP: A05:2021 · CWE-16.

**Buscar:**

- `next.config.{js,ts}`: headers `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`.
- CORS en Fiber: `AllowOrigins: "*"` con `AllowCredentials: true` ⇒ crítico.
- Cookies de sesión sin `Secure`/`HttpOnly`/`SameSite`.
- Debug endpoints, Swagger UI o pprof expuestos en prod.

---

## 9. SSRF / Open Redirect / CSRF

- **Open Redirect:** `redirect=...` query params sin allowlist (`rg -n "redirect|return_to|next=" dashboard-web/`).
- **CSRF:** server actions y mutaciones sin verificación de origen / token cuando hay sesión por cookie.

---

## 10. Identificación e Integridad de software/datos — A08:2021

- `package-lock.json` / `go.sum` presentes y consistentes.
- Sin scripts `postinstall` sospechosos en deps.
- Sin descarga remota de binarios en build.

---

## Severidad → CVSS (guía rápida)

| Banda | CVSS | Criterio |
| --- | --- | --- |
| Crítica | 9.0–10.0 | RCE, exposición masiva PII, auth bypass total |
| Alta | 7.0–8.9 | SQLi explotable, SSRF a interno, XSS almacenado con sesión |
| Media | 4.0–6.9 | XSS reflejado, IDOR limitado, verbose errors con SQL |
| Baja | 0.1–3.9 | Headers faltantes, info disclosure menor |
| Info | 0.0 | Buenas prácticas, hardening sugerido |

---

## Notas para el reporte

- Citar la fuente: `PDF §3.x` o `OWASP A0X:2021` o `CWE-XXX`.
- Adjuntar siempre `path:line` exacto.
- PoC **conceptual** — nunca ejecutar exploits.
- Si una herramienta automática no está instalada, marcarlo y no instalarla sin permiso.
