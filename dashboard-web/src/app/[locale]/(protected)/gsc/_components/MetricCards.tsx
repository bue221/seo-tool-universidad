import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCTR, formatDelta, formatNumber, formatPosition } from '../_lib/format';
import type { GscMetrics } from '@/lib/gsc/types';

interface MetricCardsProps {
  totals: GscMetrics;
  previous: GscMetrics;
  labels: { clicks: string; impressions: string; ctr: string; position: string };
}

export function MetricCards({ totals, previous, labels }: MetricCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        label={labels.clicks}
        value={formatNumber(totals.clicks)}
        delta={formatDelta(totals.clicks, previous.clicks, 'clicks')}
      />
      <Tile
        label={labels.impressions}
        value={formatNumber(totals.impressions)}
        delta={formatDelta(totals.impressions, previous.impressions, 'impressions')}
      />
      <Tile
        label={labels.ctr}
        value={formatCTR(totals.ctr)}
        delta={formatDelta(totals.ctr, previous.ctr, 'ctr')}
      />
      <Tile
        label={labels.position}
        value={formatPosition(totals.position)}
        delta={formatDelta(totals.position, previous.position, 'position')}
      />
    </div>
  );
}

function Tile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: ReturnType<typeof formatDelta>;
}) {
  const Icon = delta.tone === 'up' ? ArrowUp : delta.tone === 'down' ? ArrowDown : ArrowRight;
  const tone =
    delta.tone === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : delta.tone === 'down'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-muted-foreground';
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className={cn('flex items-center gap-1 text-xs tabular-nums', tone)}>
          <Icon className="size-3" aria-hidden />
          {delta.label}
        </p>
      </CardContent>
    </Card>
  );
}
