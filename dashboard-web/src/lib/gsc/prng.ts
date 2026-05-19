/**
 * Tiny deterministic PRNG used by the Search Console simulator.
 *
 * `mulberry32` is a 32-bit, period-2^32 generator that produces uniform
 * floats in [0, 1). It's not crypto-grade — that's the point: we want
 * fast, reproducible, dependency-free pseudo-randomness so the same
 * domain + range always yields the same dataset.
 */

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a stable 32-bit seed derived from SHA-256(domain).
 * Uses Web Crypto, which is available in Node 20+ (Next 15 runtime).
 */
export async function seedFromDomain(domain: string): Promise<number> {
  const data = new TextEncoder().encode(domain.toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  // First 4 bytes interpreted as a big-endian uint32.
  return new DataView(hash).getUint32(0, false);
}

/** Returns a float uniformly in [min, max). */
export function randRange(rand: () => number, min: number, max: number): number {
  return min + (max - min) * rand();
}

/** Returns an integer uniformly in [min, max]. */
export function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(randRange(rand, min, max + 1));
}

/** Fisher–Yates shuffle. Returns a new array, doesn't mutate the input. */
export function shuffle<T>(rand: () => number, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
