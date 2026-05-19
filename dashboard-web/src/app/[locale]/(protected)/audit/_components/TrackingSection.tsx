import { Card, CardContent } from '@/components/ui/card';
import type { AuditResult } from '@/lib/audit/types';

export function TrackingSection({ result }: { result: AuditResult }) {
  if (!result.scraper) {
    return <Card className="border-destructive"><CardContent className="p-4 text-sm">Tracking unavailable.</CardContent></Card>;
  }

  const { gtm, ga4, googleAds } = result.scraper.tracking;

  return (
    <Card>
      <CardContent className="space-y-2 p-4 text-sm">
        <p>GTM: {gtm.detected ? 'Detected' : 'Not detected'}</p>
        <p>GA4: {ga4.detected ? 'Detected' : 'Not detected'}</p>
        <p>Ads: {googleAds.detected ? 'Detected' : 'Not detected'}</p>
      </CardContent>
    </Card>
  );
}
