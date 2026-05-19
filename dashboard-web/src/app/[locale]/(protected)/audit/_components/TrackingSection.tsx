import { getTranslations } from 'next-intl/server';

import { Card, CardContent } from '@/components/ui/card';
import type { AuditResult } from '@/lib/audit/types';

export async function TrackingSection({ result }: { result: AuditResult }) {
  const t = await getTranslations('Audit.Result.Sections');
  if (!result.scraper) {
    return <Card className="border-destructive"><CardContent className="p-4 text-sm">{t('trackingUnavailable')}</CardContent></Card>;
  }

  const { gtm, ga4, googleAds } = result.scraper.tracking;
  const label = (b: boolean) => (b ? t('detected') : t('notDetected'));

  return (
    <Card>
      <CardContent className="space-y-2 p-4 text-sm">
        <p>GTM: {label(gtm.detected)}</p>
        <p>GA4: {label(ga4.detected)}</p>
        <p>Ads: {label(googleAds.detected)}</p>
      </CardContent>
    </Card>
  );
}
