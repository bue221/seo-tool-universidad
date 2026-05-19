import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchScraper } from './scraper';

describe('fetchScraper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses valid audit-contract payload', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        url: 'https://example.com',
        fetchedAt: new Date().toISOString(),
        onPage: {
          title: { value: 'x', lengthScore: 0.8 },
          metaDescription: { value: 'x', lengthScore: 0.7 },
          h1: { count: 1, value: 'x' },
          images: { total: 1, withAlt: 1, altCoverage: 1 },
        },
        tracking: {
          gtm: { detected: true, ids: [] },
          ga4: { detected: true, ids: [] },
          googleAds: { detected: false, ids: [] },
        },
        keywords: { top: [] },
        sentiment: { polarity: 'neutral', score: 0 },
      }),
    } as Response);

    const result = await fetchScraper('https://example.com');
    expect(result.ok).toBe(true);
  });

  it('maps http errors', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 503 } as Response);
    const result = await fetchScraper('https://example.com');
    expect(result).toEqual({ ok: false, error: 'UPSTREAM_5XX' });
  });

  it('handles invalid payload', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
    const result = await fetchScraper('https://example.com');
    expect(result).toEqual({ ok: false, error: 'INVALID_RESPONSE' });
  });
});
