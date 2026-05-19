import { ArrowRight, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { formatCTR, formatNumber, formatPosition } from '../_lib/format';
import type { GscMetrics } from '@/lib/gsc/types';

interface PropertyCardProps {
  property: string;
  totals: GscMetrics;
  rangeLabel: string;
}

export function PropertyCard({ property, totals, rangeLabel }: PropertyCardProps) {
  return (
    <Link
      href={`/gsc/${encodeURIComponent(property)}/overview`}
      className="group block"
    >
      <Card interactive className="h-full">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Globe className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate">{property}</span>
            <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <Metric label="Clicks" value={formatNumber(totals.clicks)} />
            <Metric label="Impressions" value={formatNumber(totals.impressions)} />
            <Metric label="CTR" value={formatCTR(totals.ctr)} />
            <Metric label="Position" value={formatPosition(totals.position)} />
          </div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{rangeLabel}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-foreground tabular-nums">{value}</p>
      <p>{label}</p>
    </div>
  );
}
