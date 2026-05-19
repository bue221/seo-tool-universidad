import type { ComparisonEntry, HeatmapTone, MetricDirection } from './types';

/**
 * Lowercase host, drop protocol/trailing slash. Used to detect duplicate
 * inputs (`http://x.com/` and `https://x.com` collide).
 */
export function normalizeUrl(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

/**
 * Returns the relative tone of `value` against `all`:
 *   - 'best'    → matches the best value in the set
 *   - 'worst'   → matches the worst value in the set
 *   - 'mid'     → everything in between
 *   - 'neutral' → all values are equal (no meaningful comparison)
 */
export function colorFor(
  value: number,
  all: number[],
  direction: MetricDirection,
): HeatmapTone {
  const filtered = all.filter((v) => Number.isFinite(v));
  if (filtered.length === 0) return 'neutral';
  const max = Math.max(...filtered);
  const min = Math.min(...filtered);
  if (max === min) return 'neutral';

  const best = direction === 'asc' ? max : min;
  const worst = direction === 'asc' ? min : max;
  if (value === best) return 'best';
  if (value === worst) return 'worst';
  return 'mid';
}

/**
 * Computes the keyword gap across the user's own audit and the
 * competitor set.
 *
 * - `yoursOnly`: terms in your top-N that don't appear in any competitor.
 * - `competitorsOnly`: terms in any competitor's top-N missing from yours.
 * - `shared`: terms present in both sides.
 */
export function computeKeywordGap(entries: ComparisonEntry[]): {
  yoursOnly: string[];
  competitorsOnly: string[];
  shared: string[];
} {
  const yours = new Set<string>(
    entries[0]?.audit?.scraper?.keywords.top.map((k) => k.term) ?? [],
  );
  const others = new Set<string>(
    entries
      .slice(1)
      .flatMap((e) => e.audit?.scraper?.keywords.top.map((k) => k.term) ?? []),
  );
  return {
    yoursOnly: [...yours].filter((k) => !others.has(k)),
    competitorsOnly: [...others].filter((k) => !yours.has(k)),
    shared: [...yours].filter((k) => others.has(k)),
  };
}

/**
 * Race a promise against a timeout. Rejects with `TIMEOUT` if the
 * promise didn't resolve in time. We don't try to cancel the
 * underlying work — fetch should respect its own AbortController, but
 * for this UI it's acceptable to let the request finish in the
 * background.
 */
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      },
    );
  });
}
