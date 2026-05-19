import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { computeKeywordGap } from '../_lib/compare';
import type { ComparisonEntry } from '../_lib/types';

interface KeywordGapProps {
  entries: ComparisonEntry[];
  labels: {
    title: string;
    yoursOnly: string;
    shared: string;
    competitorsOnly: string;
    empty: string;
  };
}

export function KeywordGap({ entries, labels }: KeywordGapProps) {
  const { yoursOnly, shared, competitorsOnly } = computeKeywordGap(entries);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{labels.title}</h2>
        <Section label={labels.yoursOnly} terms={yoursOnly} emptyText={labels.empty} variant="default" />
        <Section label={labels.shared} terms={shared} emptyText={labels.empty} variant="secondary" />
        <Section label={labels.competitorsOnly} terms={competitorsOnly} emptyText={labels.empty} variant="outline" />
      </CardContent>
    </Card>
  );
}

function Section({
  label,
  terms,
  emptyText,
  variant,
}: {
  label: string;
  terms: string[];
  emptyText: string;
  variant: 'default' | 'secondary' | 'outline';
}) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
        {label} ({terms.length})
      </p>
      {terms.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {terms.map((t) => (
            <Badge key={t} variant={variant}>
              {t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
