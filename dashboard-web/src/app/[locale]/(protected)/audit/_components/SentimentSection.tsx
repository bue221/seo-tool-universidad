import { getTranslations } from 'next-intl/server';

import { Card, CardContent } from '@/components/ui/card';
import type { AuditResult } from '@/lib/audit/types';

export async function SentimentSection({ result }: { result: AuditResult }) {
  const t = await getTranslations('Audit.Result.Sentiment');

  if (!result.scraper) {
    return <Card className="border-destructive"><CardContent className="p-4 text-sm">{t('unavailable')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-4 text-sm">
        <p>{t('polarity')}: {result.scraper.sentiment.polarity}</p>
        <p>{t('score')}: {result.scraper.sentiment.score}</p>
      </CardContent>
    </Card>
  );
}
