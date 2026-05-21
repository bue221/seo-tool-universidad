# Proposal: local-ai-webllm

**Domain:** `dashboard-web`
**Status:** PROPOSED
**Created:** 2026-05-21

## Why

Queremos sumar una capa de AI que sea **gratis** y **privada por defecto**.

- Gratis: sin costos de API.
- Privada: el prompt y la respuesta no salen del navegador.
- Sin keys: el usuario no pega credenciales.

## What

### In scope

1. Integración **WebLLM** (`@mlc-ai/web-llm`) corriendo en el navegador (WebGPU).
2. Botón "Explain with AI" en la tab **Recommendations** del detalle de auditoría:
   - toma `recommendation` + contexto mínimo del snapshot
   - devuelve un plan de acción en lenguaje humano
   - streaming token-by-token
3. UI de carga del modelo con:
   - disclaimer: descarga inicial grande + cache local
   - progress indicator
   - botón "Clear AI cache" (borra IndexedDB/CacheStorage del modelo)
4. Seguridad/privacidad visible:
   - badge "Runs locally" / "No server calls"
   - documentación breve en Settings o inline.

### Non-goals

- Integración con APIs pagas (OpenAI/Anthropic/Gemini).
- Guardar prompts/respuestas en DB.
- Chat general multi-turn (MVP se limita a explain-one-recommendation).

## Success metrics

- El modelo se carga solo bajo demanda (sin impactar navegación general).
- El usuario ve claramente que es local (disclosure).
- No hay requests a endpoints propios del backend para inference.

## Risks

- Tamaño del modelo (descarga/caching).
- WebGPU no disponible en algunos browsers.

## Mitigations

- Modelo pequeño por default.
- Fallback UX cuando no hay WebGPU (mensaje y no rompe la página).
- Dynamic import + `use client` para evitar SSR crashes.
