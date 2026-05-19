import { getTranslations } from 'next-intl/server';

import { Card, CardContent } from '@/components/ui/card';
import type { AuditResult } from '@/lib/audit/types';
import { ScoreBadge } from './ScoreBadge';

export async function PageSpeedSection({ result }: { result: AuditResult }) {
  const t = await getTranslations('Audit.Result.Sections');
  if (!result.pagespeed) {
    return <Card className="border-destructive"><CardContent className="p-4 text-sm">{t('pagespeedUnavailable')}</CardContent></Card>;
  }

  const ps = result.pagespeed;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Metric label="Performance" score={ps.performance} />
      <Metric label="Accessibility" score={ps.accessibility} />
      <Metric label="Best Practices" score={ps.bestPractices} />
      <Metric label="SEO" score={ps.seo} />
    </div>
  );
}

function Metric({ label, score }: { label: string; score: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <span>{label}</span>
        <ScoreBadge score={score} />
      </CardContent>
    </Card>
  );
}
