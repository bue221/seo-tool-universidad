import { Card, CardContent } from '@/components/ui/card';
import type { AuditResult } from '@/lib/audit/types';

export function SentimentSection({ result }: { result: AuditResult }) {
  if (!result.scraper) {
    return <Card className="border-destructive"><CardContent className="p-4 text-sm">Sentiment unavailable.</CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-4 text-sm">
        <p>Polarity: {result.scraper.sentiment.polarity}</p>
        <p>Score: {result.scraper.sentiment.score}</p>
      </CardContent>
    </Card>
  );
}
