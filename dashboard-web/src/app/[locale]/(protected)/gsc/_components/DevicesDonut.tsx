import type { GscDeviceRow } from '@/lib/gsc/types';
import { formatNumber } from '../_lib/format';

interface DevicesDonutProps {
  rows: GscDeviceRow[];
  labels: Record<GscDeviceRow['device'], string>;
}

/**
 * Pure SVG donut chart. Renders mobile/desktop/tablet share of clicks
 * with no chart library dependency. Stroke segments are computed from
 * the cumulative click share, rendered on a single circle via
 * `strokeDashoffset` rotation.
 */
export function DevicesDonut({ rows, labels }: DevicesDonutProps) {
  const total = rows.reduce((acc, r) => acc + r.clicks, 0) || 1;
  const palette = {
    mobile: 'stroke-primary',
    desktop: 'stroke-sky-500',
    tablet: 'stroke-amber-500',
  } as const;
  const fills = {
    mobile: 'bg-primary',
    desktop: 'bg-sky-500',
    tablet: 'bg-amber-500',
  } as const;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const segments = rows.map((row) => {
    const share = row.clicks / total;
    const length = circumference * share;
    const offset = circumference * (1 - cumulative);
    cumulative += share;
    return { row, length, offset, share };
  });

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
      <svg viewBox="0 0 160 160" className="size-40 -rotate-90">
        <circle cx="80" cy="80" r={radius} className="fill-none stroke-muted/40" strokeWidth="18" />
        {segments.map((s) => (
          <circle
            key={s.row.device}
            cx="80"
            cy="80"
            r={radius}
            className={`fill-none ${palette[s.row.device]}`}
            strokeWidth="18"
            strokeLinecap="butt"
            strokeDasharray={`${s.length} ${circumference - s.length}`}
            strokeDashoffset={s.offset}
          />
        ))}
      </svg>

      <ul className="grid flex-1 gap-2 text-sm">
        {segments.map((s) => (
          <li key={s.row.device} className="flex items-center gap-2">
            <span className={`inline-block size-3 shrink-0 rounded-sm ${fills[s.row.device]}`} aria-hidden />
            <span className="flex-1">{labels[s.row.device]}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatNumber(s.row.clicks)} ({(s.share * 100).toFixed(1)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
