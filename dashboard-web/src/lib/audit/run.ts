import 'server-only';

import { fetchPageSpeed } from './pagespeed';
import { fetchScraper } from './scraper';
import { calculateGlobalScore } from './score';
import type { AuditResult, PartialFailure } from './types';

/**
 * Composable, persistence-free audit pipeline.
 *
 * Used by:
 *   - the `runAudit` server action (which then persists the snapshot)
 *   - the comparison flow (which runs N audits in parallel without saving)
 *
 * Both upstream calls are issued via `Promise.allSettled` so a single
 * failure never bubbles up: callers get a `partialFailure` payload and
 * decide whether the audit is usable.
 *
 * Returns `null` only when BOTH PageSpeed and the scraper failed —
 * there's nothing meaningful left to render.
 */
export async function runFullAudit(url: string): Promise<AuditResult | null> {
  const [pagespeedSettled, scraperSettled] = await Promise.allSettled([
    fetchPageSpeed(url),
    fetchScraper(url),
  ]);

  const pagespeed =
    pagespeedSettled.status === 'fulfilled' && pagespeedSettled.value.ok
      ? pagespeedSettled.value.data
      : null;

  const scraper =
    scraperSettled.status === 'fulfilled' && scraperSettled.value.ok
      ? scraperSettled.value.data
      : null;

  if (!pagespeed && !scraper) return null;

  const partial: PartialFailure = {
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

  return {
    url,
    fetchedAt: new Date().toISOString(),
    pagespeed,
    scraper,
    globalScore: calculateGlobalScore({ pagespeed, scraper }),
    partialFailure: partial.pagespeed || partial.scraper ? partial : null,
  };
}
