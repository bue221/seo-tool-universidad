'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { fetchPageSpeed } from '@/lib/audit/pagespeed';
import { saveSnapshot } from '@/lib/audit/persistence';
import { fetchScraper } from '@/lib/audit/scraper';
import { calculateGlobalScore } from '@/lib/audit/score';
import type { AuditResult } from '@/lib/audit/types';

const inputSchema = z.object({
  url: z.string().url().max(2000).refine((v) => /^https?:\/\//.test(v), {
    message: 'INVALID_URL',
  }),
  locale: z.enum(['es', 'en']).default('es'),
});

export async function runAudit(formData: FormData) {
  const parsed = inputSchema.safeParse({
    url: formData.get('url'),
    locale: formData.get('locale') ?? 'es',
  });

  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_URL' } } as const;
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: { code: 'UNAUTHORIZED' } } as const;
  }

  const [pagespeedSettled, scraperSettled] = await Promise.allSettled([
    fetchPageSpeed(parsed.data.url),
    fetchScraper(parsed.data.url),
  ]);

  const pagespeed =
    pagespeedSettled.status === 'fulfilled' && pagespeedSettled.value.ok
      ? pagespeedSettled.value.data
      : null;

  const scraper =
    scraperSettled.status === 'fulfilled' && scraperSettled.value.ok
      ? scraperSettled.value.data
      : null;

  if (!pagespeed && !scraper) {
    return { ok: false, error: { code: 'UPSTREAM_BOTH_FAILED' } } as const;
  }

  const partialFailure = {
    pagespeed:
      pagespeedSettled.status === 'fulfilled' && !pagespeedSettled.value.ok
        ? pagespeedSettled.value.error
        : pagespeedSettled.status === 'rejected'
          ? 'TIMEOUT'
          : undefined,
    scraper:
      scraperSettled.status === 'fulfilled' && !scraperSettled.value.ok
        ? scraperSettled.value.error
        : scraperSettled.status === 'rejected'
          ? 'TIMEOUT'
          : undefined,
  };

  const audit: AuditResult = {
    url: parsed.data.url,
    fetchedAt: new Date().toISOString(),
    pagespeed,
    scraper,
    globalScore: calculateGlobalScore({ pagespeed, scraper }),
    partialFailure: partialFailure.pagespeed || partialFailure.scraper ? partialFailure : null,
  };

  const snapshotId = await saveSnapshot(user.id, audit);
  revalidatePath(`/${parsed.data.locale}/audit`);

  return { ok: true, snapshotId } as const;
}
