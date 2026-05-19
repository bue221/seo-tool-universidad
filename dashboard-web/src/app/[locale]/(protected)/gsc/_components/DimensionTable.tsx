import { Card, CardContent } from '@/components/ui/card';
import { formatCTR, formatNumber, formatPosition } from '../_lib/format';

interface DimensionRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface DimensionTableProps {
  rows: DimensionRow[];
  /** Header label for the first column (e.g. "Query", "Page"). */
  dimensionLabel: string;
  metricLabels: {
    clicks: string;
    impressions: string;
    ctr: string;
    position: string;
  };
  /** Optional renderer for the first column — defaults to plain text. */
  renderKey?: (key: string) => React.ReactNode;
}

/**
 * Server-rendered, read-only table for query/page/country views.
 *
 * Sorting is fixed (clicks desc) because rows arrive pre-sorted from
 * the generator. We intentionally skip client-side sort to keep this
 * a server component — the dataset is small (≤50 rows) and the
 * additional interactivity isn't worth the hydration cost on a low-
 * traffic page.
 */
export function DimensionTable({
  rows,
  dimensionLabel,
  metricLabels,
  renderKey,
}: DimensionTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="px-4 py-2 font-medium">{dimensionLabel}</th>
                <th className="px-4 py-2 text-right font-medium">{metricLabels.clicks}</th>
                <th className="px-4 py-2 text-right font-medium">{metricLabels.impressions}</th>
                <th className="px-4 py-2 text-right font-medium">{metricLabels.ctr}</th>
                <th className="px-4 py-2 text-right font-medium">{metricLabels.position}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={`${row.key}-${i}`}
                  className="border-b border-border/30 last:border-0 hover:bg-muted/40"
                >
                  <td className="max-w-[20rem] truncate px-4 py-2">
                    {renderKey ? renderKey(row.key) : row.key}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatNumber(row.clicks)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatNumber(row.impressions)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatCTR(row.ctr)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatPosition(row.position)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
