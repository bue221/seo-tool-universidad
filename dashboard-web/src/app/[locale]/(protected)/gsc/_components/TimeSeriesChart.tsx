import type { GscSeriesPoint } from '@/lib/gsc/types';

interface TimeSeriesChartProps {
  series: GscSeriesPoint[];
  labels: { clicks: string; impressions: string };
}

/**
 * Pure SVG dual-line chart: clicks (filled, primary tone) overlayed on
 * impressions (outline, muted tone). No chart library to avoid bundling
 * recharts for a single visualization on a low-traffic page.
 *
 * Geometry:
 *   - viewBox 800×240 with 32px left padding for y-axis hints
 *   - both series normalize to their own max so they share the same
 *     vertical range without one dominating the other
 *   - 4 horizontal grid lines (25/50/75/100%) for orientation
 */
export function TimeSeriesChart({ series, labels }: TimeSeriesChartProps) {
  if (series.length < 2) return null;

  const width = 800;
  const height = 240;
  const padding = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxClicks = Math.max(...series.map((p) => p.clicks), 1);
  const maxImpr = Math.max(...series.map((p) => p.impressions), 1);

  const x = (i: number) => padding.left + (i * innerW) / (series.length - 1);
  const yClicks = (v: number) => padding.top + innerH - (v / maxClicks) * innerH;
  const yImpr = (v: number) => padding.top + innerH - (v / maxImpr) * innerH;

  const linePath = (ys: number[]) =>
    ys.map((y, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y}`).join(' ');

  const areaPath = (ys: number[]) =>
    `${linePath(ys)} L ${x(series.length - 1)} ${padding.top + innerH} L ${x(0)} ${padding.top + innerH} Z`;

  const clicksY = series.map((p) => yClicks(p.clicks));
  const imprY = series.map((p) => yImpr(p.impressions));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-60 w-full min-w-[480px]"
        role="img"
        aria-label={`${labels.clicks} / ${labels.impressions}`}
      >
        {/* horizontal grid */}
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padding.top + innerH - innerH * frac;
          return (
            <line
              key={frac}
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              className="stroke-border/50"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          );
        })}

        {/* impressions: muted outline */}
        <path d={linePath(imprY)} className="fill-none stroke-muted-foreground/60" strokeWidth={1.5} />

        {/* clicks: primary, filled area */}
        <path d={areaPath(clicksY)} className="fill-primary/15" />
        <path d={linePath(clicksY)} className="fill-none stroke-primary" strokeWidth={2} />

        {/* x-axis ticks: first, mid, last */}
        {[0, Math.floor(series.length / 2), series.length - 1].map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 8}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {series[i]!.date.slice(5)}
          </text>
        ))}
      </svg>

      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1 w-3 rounded bg-primary" />
          {labels.clicks}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1 w-3 rounded bg-muted-foreground/60" />
          {labels.impressions}
        </span>
      </div>
    </div>
  );
}
