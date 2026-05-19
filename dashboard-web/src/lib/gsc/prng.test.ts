import { describe, expect, it } from 'vitest';
import { mulberry32, randInt, randRange, seedFromDomain, shuffle } from './prng';

describe('mulberry32', () => {
  it('produces deterministic sequences for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 100 }, () => a());
    const seqB = Array.from({ length: 100 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it('stays in [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('seedFromDomain', () => {
  it('is stable across calls', async () => {
    const a = await seedFromDomain('example.com');
    const b = await seedFromDomain('example.com');
    expect(a).toBe(b);
  });

  it('is case-insensitive', async () => {
    const a = await seedFromDomain('Example.COM');
    const b = await seedFromDomain('example.com');
    expect(a).toBe(b);
  });

  it('differs across domains', async () => {
    const a = await seedFromDomain('a.com');
    const b = await seedFromDomain('b.com');
    expect(a).not.toBe(b);
  });
});

describe('randRange / randInt', () => {
  it('randRange stays within bounds', () => {
    const r = mulberry32(99);
    for (let i = 0; i < 500; i++) {
      const v = randRange(r, 10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThan(20);
    }
  });

  it('randInt is inclusive on both ends', () => {
    const r = mulberry32(11);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) seen.add(randInt(r, 0, 3));
    expect(seen.has(0)).toBe(true);
    expect(seen.has(3)).toBe(true);
    expect([...seen].every((n) => n >= 0 && n <= 3)).toBe(true);
  });
});

describe('shuffle', () => {
  it('is deterministic for the same seed', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const a = shuffle(mulberry32(5), arr);
    const b = shuffle(mulberry32(5), arr);
    expect(a).toEqual(b);
  });

  it('preserves length and elements', () => {
    const arr = ['x', 'y', 'z'];
    const out = shuffle(mulberry32(1), arr);
    expect(out).toHaveLength(3);
    expect(out.sort()).toEqual(['x', 'y', 'z']);
  });

  it('does not mutate the input', () => {
    const arr = [1, 2, 3];
    shuffle(mulberry32(1), arr);
    expect(arr).toEqual([1, 2, 3]);
  });
});
