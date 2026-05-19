import { Card, CardContent } from '@/components/ui/card';
import type { AuditResult } from '@/lib/audit/types';

export function KeywordsSection({ result }: { result: AuditResult }) {
  if (!result.scraper) {
    return <Card className="border-destructive"><CardContent className="p-4 text-sm">Keywords unavailable.</CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-4 text-sm">
        {result.scraper.keywords.top.slice(0, 5).map((k) => (
          <p key={k.term}>
            {k.term}: {(k.density * 100).toFixed(2)}%
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
