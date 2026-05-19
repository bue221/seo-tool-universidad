import { AlertTriangle, Check, X } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  AuditResult,
  WoorankCategory,
  WoorankCheck,
  WoorankStatus,
} from '@/lib/audit/types';
import { cn } from '@/lib/utils';

const CATEGORY_ORDER: WoorankCategory[] = [
  'meta',
  'headings',
  'mobile',
  'security',
  'indexing',
  'social',
  'schema',
  'a11y',
];

/**
 * Renders the WooRank-style hygiene panel. Returns null when the snapshot
 * predates audit-contract v0.2.0 — callers can render unconditionally.
 */
export async function WoorankSection({ result }: { result: AuditResult }) {
  const woorank = result.scraper?.woorank;
  if (!woorank) return null;

  const t = await getTranslations('Audit.Result.Woorank');
  const grouped = groupByCategory(woorank.checks);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
          <ScoreRing value={woorank.score} />
        </CardHeader>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
          <CategoryCard
            key={cat}
            label={t(`categories.${cat}`)}
            checks={grouped[cat]!}
            checkLabel={(id) => safeT(t, `checks.${id}`)}
          />
        ))}
      </div>
    </div>
  );
}

// ----- pieces -----------------------------------------------------------

function CategoryCard({
  label,
  checks,
  checkLabel,
}: {
  label: string;
  checks: WoorankCheck[];
  checkLabel: (id: string) => string;
}) {
  const passed = checks.filter((c) => c.status === 'pass').length;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{label}</CardTitle>
        <Badge variant="outline">
          {passed}/{checks.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map((c) => (
          <CheckRow key={c.id} status={c.status} label={checkLabel(c.id)} evidence={c.evidence} />
        ))}
      </CardContent>
    </Card>
  );
}

function CheckRow({
  status,
  label,
  evidence,
}: {
  status: WoorankStatus;
  label: string;
  evidence?: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <StatusIcon status={status} />
      <div className="flex-1">
        <p>{label}</p>
        {evidence ? (
          <p className="text-xs text-muted-foreground">{evidence}</p>
        ) : null}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: WoorankStatus }) {
  const Icon = status === 'pass' ? Check : status === 'warn' ? AlertTriangle : X;
  const color =
    status === 'pass'
      ? 'text-emerald-600 dark:text-emerald-400'
      : status === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';
  return <Icon className={cn('mt-0.5 size-4 shrink-0', color)} aria-hidden />;
}

/**
 * Pure SVG ring — avoids pulling a chart dep just for one circle.
 * Stroke color follows the same thresholds as the docs: ≥0.85 green,
 * ≥0.60 amber, otherwise red.
 */
function ScoreRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * clamped;

  const stroke =
    clamped >= 0.85
      ? 'stroke-emerald-500'
      : clamped >= 0.6
        ? 'stroke-amber-500'
        : 'stroke-rose-500';

  return (
    <div className="relative flex size-20 items-center justify-center" role="img" aria-label={`${pct}%`}>
      <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
        <circle cx="40" cy="40" r={radius} className="fill-none stroke-muted" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          className={cn('fill-none transition-all', stroke)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <span className="absolute text-lg font-semibold tabular-nums">{pct}</span>
    </div>
  );
}

// ----- helpers ----------------------------------------------------------

function groupByCategory(checks: WoorankCheck[]): Partial<Record<WoorankCategory, WoorankCheck[]>> {
  const out: Partial<Record<WoorankCategory, WoorankCheck[]>> = {};
  for (const c of checks) {
    (out[c.category] ??= []).push(c);
  }
  return out;
}

/**
 * Wraps next-intl's `t()` so a missing key falls back to the raw id instead of
 * throwing in production. Lets us ship new check ids before the translation
 * catches up.
 */
function safeT(t: (key: string) => string, key: string): string {
  try {
    return t(key);
  } catch {
    return key.split('.').pop() ?? key;
  }
}
