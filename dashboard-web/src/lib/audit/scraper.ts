import { z } from 'zod';
import { serverEnv } from '@/lib/env';
import type { PartialFailureCode, ScraperAudit } from './types';

const scraperSchema: z.ZodType<ScraperAudit> = z.object({
  url: z.string().url(),
  fetchedAt: z.string(),
  onPage: z.object({
    title: z.object({ value: z.string(), lengthScore: z.number() }),
    metaDescription: z.object({ value: z.string(), lengthScore: z.number() }),
    h1: z.object({ count: z.number(), value: z.string() }),
    images: z.object({ total: z.number(), withAlt: z.number(), altCoverage: z.number() }),
  }),
  tracking: z.object({
    gtm: z.object({ detected: z.boolean(), ids: z.array(z.string()) }),
    ga4: z.object({ detected: z.boolean(), ids: z.array(z.string()) }),
    googleAds: z.object({ detected: z.boolean(), ids: z.array(z.string()) }),
  }),
  keywords: z.object({ top: z.array(z.object({ term: z.string(), density: z.number() })) }),
  sentiment: z.object({
    polarity: z.enum(['positive', 'neutral', 'negative']),
    score: z.number(),
  }),
});

function mapStatus(status: number): PartialFailureCode {
  if (status >= 500) return 'UPSTREAM_5XX';
  return 'UNREACHABLE';
}

export async function fetchScraper(url: string): Promise<
  { ok: true; data: ScraperAudit } | { ok: false; error: PartialFailureCode }
> {
  try {
    const response = await fetch(`${serverEnv.SCRAPER_API_URL}/api/audit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return { ok: false, error: mapStatus(response.status) };
    }

    const json = await response.json();
    const parsed = scraperSchema.safeParse(json);

    if (!parsed.success) {
      return { ok: false, error: 'INVALID_RESPONSE' };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: 'UNREACHABLE' };
  }
}
