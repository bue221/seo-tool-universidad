import type { GscRange } from '@/lib/gsc/types';

/**
 * Parses the `?range=` search param into a valid GscRange. Defaults to 28
 * (matching the GSC web UI default) and silently ignores invalid values.
 */
export function parseRangeParam(raw: string | string[] | undefined): GscRange {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (n === 7 || n === 28 || n === 90) return n;
  return 28;
}
