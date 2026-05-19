import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPageSpeed } from './pagespeed';

describe('fetchPageSpeed', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses scores from successful payload', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lighthouseResult: {
          categories: {
            performance: { score: 0.8 },
            accessibility: { score: 0.9 },
            'best-practices': { score: 0.7 },
            seo: { score: 0.6 },
          },
        },
      }),
    } as Response);

    const result = await fetchPageSpeed('https://example.com');
    expect(result.ok).toBe(true);
  });

  it('maps non-OK response to error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    const result = await fetchPageSpeed('https://example.com');
    expect(result).toEqual({ ok: false, error: 'UPSTREAM_5XX' });
  });

  it('handles malformed payloads', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
    const result = await fetchPageSpeed('https://example.com');
    expect(result).toEqual({ ok: false, error: 'INVALID_RESPONSE' });
  });
});
