import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { colorFor } from '../_lib/compare';
import type { ComparisonEntry, HeatmapTone, MetricDirection } from '../_lib/types';

interface ComparisonTableProps {
  entries: ComparisonEntry[];
  labels: {
    metric: string;
    you: string;
    error: string;
    rows: {
      psiPerformance: string;
      psiAccessibility: string;
      psiBestPractices: string;
      psiSeo: string;
      titleScore: string;
      metaDescScore: string;
      h1Count: string;
      altCoverage: string;
      gtm: string;
      ga4: string;
      googleAds: string;
      woorank: string;
      sentimentPolarity: string;
      sentimentScore: string;
      topKeyword: string;
    };
  };
}

type Cell =
  | { kind: 'number'; value: number; display: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'text'; value: string }
  | { kind: 'missing' };

interface Row {
  label: string;
  direction: MetricDirection | null; // null disables heatmap for booleans/strings
  cells: Cell[];
}

export function ComparisonTable({ entries, labels }: ComparisonTableProps) {
  const rows = buildRows(entries, labels.rows);

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-4 py-2 font-medium">{labels.metric}</th>
              {entries.map((e) => (
                <th key={e.url} className="px-4 py-2 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{e.url}</span>
                    {e.isYou ? <Badge>{labels.you}</Badge> : null}
                  </div>
                  {e.status === 'error' ? (
                    <p className="mt-1 text-xs font-normal normal-case text-destructive">
                      {labels.error}: {e.error}
                    </p>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/30 last:border-0">
                <td className="px-4 py-2 text-muted-foreground">{row.label}</td>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className={cn('px-4 py-2', toneClass(cellTone(row, ci)))}>
                    <CellView cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ---- row builder -------------------------------------------------------

function buildRows(entries: ComparisonEntry[], rl: ComparisonTableProps['labels']['rows']): Row[] {
  const ps = (i: number) => entries[i]?.audit?.pagespeed ?? null;
  const sc = (i: number) => entries[i]?.audit?.scraper ?? null;

  const make = (
    label: string,
    direction: MetricDirection | null,
    fn: (i: number) => Cell,
  ): Row => ({
    label,
    direction,
    cells: entries.map((_, i) => fn(i)),
  });

  return [
    make(rl.psiPerformance, 'asc', (i) => numberCell(ps(i)?.performance)),
    make(rl.psiAccessibility, 'asc', (i) => numberCell(ps(i)?.accessibility)),
    make(rl.psiBestPractices, 'asc', (i) => numberCell(ps(i)?.bestPractices)),
    make(rl.psiSeo, 'asc', (i) => numberCell(ps(i)?.seo)),
    make(rl.titleScore, 'asc', (i) => numberCell(sc(i)?.onPage.title.lengthScore)),
    make(rl.metaDescScore, 'asc', (i) => numberCell(sc(i)?.onPage.metaDescription.lengthScore)),
    make(rl.h1Count, null, (i) => {
      const n = sc(i)?.onPage.h1.count;
      return n === undefined ? { kind: 'missing' } : { kind: 'number', value: n, display: String(n) };
    }),
    make(rl.altCoverage, 'asc', (i) => numberCell(sc(i)?.onPage.images.altCoverage)),
    make(rl.gtm, null, (i) => boolCell(sc(i)?.tracking.gtm.detected)),
    make(rl.ga4, null, (i) => boolCell(sc(i)?.tracking.ga4.detected)),
    make(rl.googleAds, null, (i) => boolCell(sc(i)?.tracking.googleAds.detected)),
    make(rl.woorank, 'asc', (i) => numberCell(sc(i)?.woorank?.score)),
    make(rl.sentimentPolarity, null, (i) => textCell(sc(i)?.sentiment.polarity)),
    make(rl.sentimentScore, 'asc', (i) => numberCell(sc(i)?.sentiment.score)),
    make(rl.topKeyword, null, (i) => textCell(sc(i)?.keywords.top[0]?.term)),
  ];
}

function numberCell(v: number | undefined | null): Cell {
  if (v === undefined || v === null || Number.isNaN(v)) return { kind: 'missing' };
  return { kind: 'number', value: v, display: formatScalar(v) };
}

function boolCell(v: boolean | undefined): Cell {
  return v === undefined ? { kind: 'missing' } : { kind: 'bool', value: v };
}

function textCell(v: string | undefined): Cell {
  return v ? { kind: 'text', value: v } : { kind: 'missing' };
}

function formatScalar(v: number): string {
  // 2 decimals for scores in [0, 1], integers otherwise.
  return v >= 0 && v <= 1 ? v.toFixed(2) : v.toFixed(0);
}

// ---- heatmap -----------------------------------------------------------

function cellTone(row: Row, cellIndex: number): HeatmapTone {
  if (row.direction === null) return 'neutral';
  const all: number[] = row.cells.flatMap((c) => (c.kind === 'number' ? [c.value] : []));
  const target = row.cells[cellIndex];
  if (!target || target.kind !== 'number') return 'neutral';
  return colorFor(target.value, all, row.direction);
}

function toneClass(tone: HeatmapTone): string {
  switch (tone) {
    case 'best':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    case 'worst':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300';
    case 'mid':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
    case 'neutral':
    default:
      return '';
  }
}

// ---- cell view ---------------------------------------------------------

function CellView({ cell }: { cell: Cell }) {
  if (cell.kind === 'missing') return <span className="text-muted-foreground">—</span>;
  if (cell.kind === 'number') return <span className="tabular-nums">{cell.display}</span>;
  if (cell.kind === 'bool')
    return cell.value ? (
      <span className="text-emerald-600 dark:text-emerald-400">✓</span>
    ) : (
      <span className="text-rose-600 dark:text-rose-400">✗</span>
    );
  return <span>{cell.value}</span>;
}
