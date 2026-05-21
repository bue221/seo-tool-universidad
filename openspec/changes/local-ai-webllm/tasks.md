# Tasks: local-ai-webllm

## PR-1 — WebLLM foundation

- [x] Add dependency `@mlc-ai/web-llm`.
- [x] Add client-only wrapper `src/lib/ai/webllm.ts` (engine init + progress).
- [x] Add UI components:
  - [x] `AiExplainButton` (lazy-load, streaming)
  - [x] `AiPrivacyNotice`
  - [x] `AiCacheControls` (clear cache)
- [x] Add i18n keys.

## PR-2 — Integrate into Recommendations tab

- [x] Extend `RecommendationsSection` to render AI explain UI.
- [x] Ensure no SSR imports of web-llm.

## Verify

- [x] `npm run typecheck`
- [x] `npm test`
- [ ] Manual: load model, run explain, clear cache.
