import { z } from 'zod';
import { serverEnv } from '@/lib/env';
import type { PageSpeedScores, PartialFailureCode } from './types';

const pageSpeedSchema = z.object({
  lighthouseResult: z.object({
    categories: z.object({
      performance: z.object({ score: z.number().nullable() }),
      accessibility: z.object({ score: z.number().nullable() }),
      'best-practices': z.object({ score: z.number().nullable() }),
      seo: z.object({ score: z.number().nullable() }),
    }),
    audits: z
      .object({
        'first-contentful-paint': z.object({ displayValue: z.string().optional() }).optional(),
        'largest-contentful-paint': z.object({ displayValue: z.string().optional() }).optional(),
        'cumulative-layout-shift': z.object({ displayValue: z.string().optional() }).optional(),
        'total-blocking-time': z.object({ displayValue: z.string().optional() }).optional(),
      })
      .optional(),
  }),
});

function mapStatus(status: number): PartialFailureCode {
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'UPSTREAM_5XX';
  return 'UNREACHABLE';
}

export async function fetchPageSpeed(url: string): Promise<
  { ok: true; data: PageSpeedScores } | { ok: false; error: PartialFailureCode }
> {
  try {
    const params = new URLSearchParams({
      url,
      strategy: 'mobile',
      category: 'PERFORMANCE',
    });
    params.append('category', 'ACCESSIBILITY');
    params.append('category', 'BEST_PRACTICES');
    params.append('category', 'SEO');

    if (serverEnv.PAGESPEED_API_KEY) {
      params.set('key', serverEnv.PAGESPEED_API_KEY);
    }

    const response = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      return { ok: false, error: mapStatus(response.status) };
    }

    const json = await response.json();
    const parsed = pageSpeedSchema.safeParse(json);

    if (!parsed.success) {
      return { ok: false, error: 'INVALID_RESPONSE' };
    }

    const categories = parsed.data.lighthouseResult.categories;
    const audits = parsed.data.lighthouseResult.audits;

    return {
      ok: true,
      data: {
        performance: Math.round((categories.performance.score ?? 0) * 100),
        accessibility: Math.round((categories.accessibility.score ?? 0) * 100),
        bestPractices: Math.round((categories['best-practices'].score ?? 0) * 100),
        seo: Math.round((categories.seo.score ?? 0) * 100),
        fcp: audits?.['first-contentful-paint']?.displayValue,
        lcp: audits?.['largest-contentful-paint']?.displayValue,
        cls: audits?.['cumulative-layout-shift']?.displayValue,
        tbt: audits?.['total-blocking-time']?.displayValue,
      },
    };
  } catch {
    return { ok: false, error: 'UNREACHABLE' };
  }
}
