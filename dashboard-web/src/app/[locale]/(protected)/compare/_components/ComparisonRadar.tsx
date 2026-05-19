import { Card, CardContent } from '@/components/ui/card';
import type { ComparisonEntry } from '../_lib/types';

interface ComparisonRadarProps {
  entries: ComparisonEntry[];
  labels: {
    axes: {
      psiPerformance: string;
      psiSeo: string;
      woorank: string;
      altCoverage: string;
      titleScore: string;
      metaDescScore: string;
    };
  };
}

const AXIS_COUNT = 6;

/** Color palette per entry index. Your site is always emerald. */
const STROKES = ['stroke-emerald-500', 'stroke-sky-500', 'stroke-amber-500', 'stroke-rose-500'];
const FILLS = ['fill-emerald-500/10', 'fill-sky-500/10', 'fill-amber-500/10', 'fill-rose-500/10'];
const SWATCHES = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500'];

export function ComparisonRadar({ entries, labels }: ComparisonRadarProps) {
  const axes = [
    labels.axes.psiPerformance,
    labels.axes.psiSeo,
    labels.axes.woorank,
    labels.axes.altCoverage,
    labels.axes.titleScore,
    labels.axes.metaDescScore,
  ];

  const cx = 150;
  const cy = 150;
  const r = 110;

  // Pre-compute the 6 axis vector endpoints (-90deg so axis 0 points up).
  const axisVectors = Array.from({ length: AXIS_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / AXIS_COUNT - Math.PI / 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
          <svg viewBox="0 0 300 300" className="size-72 max-w-full">
            {/* Rings: 25/50/75/100% of the unit circle. */}
            {[0.25, 0.5, 0.75, 1].map((frac) => (
              <polygon
                key={frac}
                points={axisVectors
                  .map((v) => `${cx + v.x * r * frac},${cy + v.y * r * frac}`)
                  .join(' ')}
                className="fill-none stroke-border/40"
                strokeWidth="1"
              />
            ))}

            {/* Axis spokes + labels */}
            {axisVectors.map((v, i) => (
              <g key={i}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + v.x * r}
                  y2={cy + v.y * r}
                  className="stroke-border/40"
                  strokeWidth="1"
                />
                <text
                  x={cx + v.x * (r + 14)}
                  y={cy + v.y * (r + 14) + 3}
                  textAnchor={v.x > 0.2 ? 'start' : v.x < -0.2 ? 'end' : 'middle'}
                  className="fill-muted-foreground text-[10px]"
                >
                  {axes[i]}
                </text>
              </g>
            ))}

            {/* One polygon per entry */}
            {entries.map((entry, idx) => {
              if (entry.status !== 'ok' || !entry.audit) return null;
              const values = extractAxisValues(entry);
              const points = axisVectors
                .map(
                  (v, i) =>
                    `${cx + v.x * r * values[i]!},${cy + v.y * r * values[i]!}`,
                )
                .join(' ');
              return (
                <polygon
                  key={entry.url}
                  points={points}
                  className={`${STROKES[idx % STROKES.length]} ${FILLS[idx % FILLS.length]}`}
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          <ul className="grid flex-1 gap-2 text-sm">
            {entries.map((entry, idx) => (
              <li key={entry.url} className="flex items-center gap-2">
                <span
                  className={`inline-block size-3 shrink-0 rounded-sm ${SWATCHES[idx % SWATCHES.length]}`}
                  aria-hidden
                />
                <span className="truncate">{entry.url}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Normalizes the 6 radar axes to [0, 1].
 *
 * For metrics that are already 0–1 (PSI scores, length scores, woorank,
 * alt coverage) we use the raw value. The `?? 0.5` fallback for woorank
 * applies when the scraper run predated audit-contract v0.2.0.
 */
function extractAxisValues(entry: ComparisonEntry): number[] {
  const ps = entry.audit?.pagespeed;
  const sc = entry.audit?.scraper;
  return [
    ps?.performance ?? 0,
    ps?.seo ?? 0,
    sc?.woorank?.score ?? 0.5,
    sc?.onPage.images.altCoverage ?? 0,
    sc?.onPage.title.lengthScore ?? 0,
    sc?.onPage.metaDescription.lengthScore ?? 0,
  ].map((v) => Math.min(1, Math.max(0, v)));
}
