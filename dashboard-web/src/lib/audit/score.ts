import type { PageSpeedScores, ScraperAudit } from './types';

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateGlobalScore(input: {
  pagespeed: PageSpeedScores | null;
  scraper: ScraperAudit | null;
}): number {
  const { pagespeed, scraper } = input;

  if (!pagespeed && !scraper) {
    return 0;
  }

  if (pagespeed && !scraper) {
    return round2(pagespeed.performance * 0.667 + pagespeed.seo * 0.333);
  }

  if (!pagespeed && scraper) {
    const onPage =
      ((scraper.onPage.title.lengthScore +
        scraper.onPage.metaDescription.lengthScore +
        scraper.onPage.images.altCoverage +
        (scraper.onPage.h1.count === 1 ? 1 : 0)) /
        4) *
      100;

    const tracking =
      (((scraper.tracking.gtm.detected ? 1 : 0) +
        (scraper.tracking.ga4.detected ? 1 : 0) +
        (scraper.tracking.googleAds.detected ? 1 : 0)) /
        3) *
      100;

    const sentiment = ((scraper.sentiment.score + 1) / 2) * 100;

    return round2(onPage * 0.5 + tracking * 0.25 + sentiment * 0.25);
  }

  const onPage =
    ((scraper!.onPage.title.lengthScore +
      scraper!.onPage.metaDescription.lengthScore +
      scraper!.onPage.images.altCoverage +
      (scraper!.onPage.h1.count === 1 ? 1 : 0)) /
      4) *
    100;

  const tracking =
    (((scraper!.tracking.gtm.detected ? 1 : 0) +
      (scraper!.tracking.ga4.detected ? 1 : 0) +
      (scraper!.tracking.googleAds.detected ? 1 : 0)) /
      3) *
    100;

  const sentiment = ((scraper!.sentiment.score + 1) / 2) * 100;

  return round2(
    pagespeed!.performance * 0.4 +
      pagespeed!.seo * 0.2 +
      onPage * 0.2 +
      tracking * 0.1 +
      sentiment * 0.1,
  );
}
