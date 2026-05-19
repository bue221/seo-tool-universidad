# Delta dashboard-web: woorank-checker

**Target spec:** `openspec/specs/dashboard-web/spec.md`
**Operación:** ADD (sección dentro de audit detail page)

---

## ADDED — Sección WooRank en `/audit/[snapshotId]`

### Componente

`src/app/[locale]/(protected)/audit/_components/WoorankSection.tsx`:

- Renderiza solo si `snapshot.payload.woorank != null`.
- Layout: `ScoreRing` SVG inline + accordion shadcn agrupado por `category`.
- Color del ring por threshold:
  - `score ≥ 0.85` → verde.
  - `0.60 ≤ score < 0.85` → ámbar.
  - `< 0.60` → rojo.

### TypeScript types

`src/lib/audit/types.ts` extendido:

```ts
export type WoorankStatus = "pass" | "warn" | "fail";
export type WoorankCategory =
  | "meta" | "headings" | "mobile" | "indexing"
  | "security" | "social" | "schema" | "a11y";

export interface WoorankCheck {
  id: string;
  label: string;
  category: WoorankCategory;
  status: WoorankStatus;
  evidence?: string;
  weight: number;
}

export interface WoorankResult {
  score: number;
  checks: WoorankCheck[];
}
```

### i18n

- `Woorank.Common` — score, category labels, status labels.
- `Woorank.Checks.<id>` — un key descriptivo por checkId (16 keys).

### Compatibilidad

- Snapshots sin `woorank` no muestran la sección. No es error.
- `payload` sigue siendo el mismo jsonb; no requiere migración.
