import { describe, expect, it } from 'vitest';
import { colorFor, computeKeywordGap, normalizeUrl, withTimeout } from './compare';
import type { ComparisonEntry } from './types';

describe('normalizeUrl', () => {
  it.each([
    ['HTTPS://Example.com/', 'example.com'],
    ['http://x.com', 'x.com'],
    ['  https://X.com/path/  ', 'x.com/path'],
  ])('normalizes %s → %s', (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });
});

describe('colorFor', () => {
  it('returns neutral when all values are equal', () => {
    expect(colorFor(5, [5, 5, 5], 'asc')).toBe('neutral');
  });

  it('marks best/worst correctly when higher is better', () => {
    expect(colorFor(10, [1, 5, 10], 'asc')).toBe('best');
    expect(colorFor(1, [1, 5, 10], 'asc')).toBe('worst');
    expect(colorFor(5, [1, 5, 10], 'asc')).toBe('mid');
  });

  it('marks best/worst correctly when lower is better', () => {
    expect(colorFor(1, [1, 5, 10], 'desc')).toBe('best');
    expect(colorFor(10, [1, 5, 10], 'desc')).toBe('worst');
  });

  it('ignores non-finite values', () => {
    expect(colorFor(2, [2, NaN, Infinity], 'asc')).toBe('neutral');
  });
});

function entry(url: string, isYou: boolean, terms: string[]): ComparisonEntry {
  return {
    url,
    isYou,
    status: 'ok',
    audit: {
      url,
      fetchedAt: '2026-05-19T00:00:00.000Z',
      pagespeed: null,
      scraper: {
        url,
        fetchedAt: '',
        onPage: {
          title: { value: '', lengthScore: 0 },
          metaDescription: { value: '', lengthScore: 0 },
          h1: { count: 0, value: '' },
          images: { total: 0, withAlt: 0, altCoverage: 0 },
        },
        tracking: {
          gtm: { detected: false, ids: [] },
          ga4: { detected: false, ids: [] },
          googleAds: { detected: false, ids: [] },
        },
        keywords: { top: terms.map((t) => ({ term: t, density: 0.1 })) },
        sentiment: { polarity: 'neutral', score: 0 },
      },
      globalScore: 0,
      partialFailure: null,
    },
  };
}

describe('computeKeywordGap', () => {
  it('partitions terms into yoursOnly / shared / competitorsOnly', () => {
    const result = computeKeywordGap([
      entry('a.com', true, ['seo', 'analytics', 'wordpress']),
      entry('b.com', false, ['analytics', 'ecommerce']),
      entry('c.com', false, ['wordpress', 'saas']),
    ]);
    expect(result.yoursOnly.sort()).toEqual(['seo']);
    expect(result.shared.sort()).toEqual(['analytics', 'wordpress']);
    expect(result.competitorsOnly.sort()).toEqual(['ecommerce', 'saas']);
  });

  it('handles empty competitor list', () => {
    const result = computeKeywordGap([entry('a.com', true, ['x'])]);
    expect(result.yoursOnly).toEqual(['x']);
    expect(result.shared).toEqual([]);
    expect(result.competitorsOnly).toEqual([]);
  });
});

describe('withTimeout', () => {
  it('resolves before the timer fires', async () => {
    const v = await withTimeout(Promise.resolve(42), 100);
    expect(v).toBe(42);
  });

  it('rejects with TIMEOUT when the promise is slower', async () => {
    const slow = new Promise<number>((res) => setTimeout(() => res(1), 50));
    await expect(withTimeout(slow, 10)).rejects.toThrow('TIMEOUT');
  });
});
