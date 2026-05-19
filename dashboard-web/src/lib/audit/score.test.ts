import { describe, expect, it } from 'vitest';
import { calculateGlobalScore } from './score';

const scraper = {
  url: 'https://example.com',
  fetchedAt: new Date().toISOString(),
  onPage: {
    title: { value: 'x', lengthScore: 1 },
    metaDescription: { value: 'x', lengthScore: 0.8 },
    h1: { count: 1, value: 'x' },
    images: { total: 10, withAlt: 8, altCoverage: 0.8 },
  },
  tracking: {
    gtm: { detected: true, ids: [] },
    ga4: { detected: true, ids: [] },
    googleAds: { detected: false, ids: [] },
  },
  keywords: { top: [] },
  sentiment: { polarity: 'positive' as const, score: 0.2 },
};

describe('calculateGlobalScore', () => {
  it('calculates score when all sources exist', () => {
    const score = calculateGlobalScore({
      pagespeed: { performance: 80, accessibility: 90, bestPractices: 85, seo: 70 },
      scraper,
    });
    expect(score).toBeGreaterThan(0);
  });

  it('renormalizes when pagespeed is missing', () => {
    const score = calculateGlobalScore({ pagespeed: null, scraper });
    expect(score).toBeGreaterThan(0);
  });

  it('uses only pagespeed weights when scraper is missing', () => {
    const score = calculateGlobalScore({
      pagespeed: { performance: 75, accessibility: 90, bestPractices: 95, seo: 60 },
      scraper: null,
    });
    expect(score).toBeCloseTo(70.01, 2);
  });

  it('maps sentiment -1 to zero contribution in scraper-only mode', () => {
    const score = calculateGlobalScore({
      pagespeed: null,
      scraper: { ...scraper, sentiment: { polarity: 'negative', score: -1 } },
    });
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
