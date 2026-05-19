import { Card, CardContent } from '@/components/ui/card';
import type { AuditResult } from '@/lib/audit/types';

export function OnPageSection({ result }: { result: AuditResult }) {
  if (!result.scraper) {
    return <Card className="border-destructive"><CardContent className="p-4 text-sm">On-page unavailable.</CardContent></Card>;
  }

  const onPage = result.scraper.onPage;

  return (
    <Card>
      <CardContent className="space-y-2 p-4 text-sm">
        <p><strong>Title:</strong> {onPage.title.value}</p>
        <p><strong>Meta:</strong> {onPage.metaDescription.value}</p>
        <p><strong>H1:</strong> {onPage.h1.count}</p>
        <p><strong>Alt coverage:</strong> {Math.round(onPage.images.altCoverage * 100)}%</p>
      </CardContent>
    </Card>
  );
}
