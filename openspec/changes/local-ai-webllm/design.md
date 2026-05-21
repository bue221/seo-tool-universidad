# Design: local-ai-webllm

## 1) Runtime model

- Solo client-side.
- Carga lazy al click.
- Usa `CreateMLCEngine(modelId, { initProgressCallback })`.
- Streaming via `engine.chat.completions.create({ stream: true, messages })`.

## 2) Default model choice

MVP: un modelo instruct pequeño (1B–2B) quantizado.

- Default: `Llama-3.2-1B-Instruct-q4f16_1-MLC` (ajustable).

## 3) UX

### States

- idle → show "Load AI" + disclaimer.
- loading → progress % + bytes text.
- ready → show "Explain" buttons.
- error → show non-blocking fallback (no WebGPU, out of memory, etc.).

### Placement

- Tab `Recommendations`:
  - cada card tiene botón `Explain with AI`.
  - respuesta se muestra debajo como panel plegable.

## 4) Privacy guarantees

- No API keys.
- No request to `dashboard-web` server actions for inference.
- Network only for downloading model artifacts (static weights) from configured host.

## 5) Cache clear

- Clear WebLLM caches:
  - `indexedDB.databases()` → delete DBs matching `webllm`/`mlc` prefixes (best-effort)
  - `caches.keys()` → delete matching caches (best-effort)

## 6) Fallback

- If `navigator.gpu` missing: show message and disable AI.
