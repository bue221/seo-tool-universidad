import { getTranslations } from 'next-intl/server';

import { KpiCard } from '@/components/app/KpiCard';
import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';
import { listSnapshots } from '@/lib/audit/persistence';

export default async function AnalyticsPage() {
  const snapshots = await listSnapshots(30);
  const t = await getTranslations('Analytics');

  if (!snapshots.length) {
    return <p className="text-sm text-muted-foreground">{t('empty')}</p>;
  }

  const avg = snapshots.reduce((acc, s) => acc + Number(s.global_score), 0) / snapshots.length;
  const best = Math.max(...snapshots.map((s) => Number(s.global_score)));
  const worst = Math.min(...snapshots.map((s) => Number(s.global_score)));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title={t('kpi.total')} value={String(snapshots.length)} />
        <KpiCard title={t('kpi.average')} value={avg.toFixed(2)} />
        <KpiCard title={t('kpi.bestWorst')} value={`${best.toFixed(1)} / ${worst.toFixed(1)}`} />
      </div>

      <SectionCard title={t('trendTitle')}>
        <div className="space-y-2">
          {snapshots.slice(0, 10).reverse().map((row, idx) => {
            const score = Number(row.global_score);
            return (
              <div key={row.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-xs text-muted-foreground">{idx + 1}</span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${score}%` }} />
                </div>
                <span className="w-12 text-right font-medium">{score.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title={t('recentTitle')}>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[680px] text-left text-sm">
            <caption className="sr-only">{t('tableCaption')}</caption>
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{t('Table.url')}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t('Table.date')}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t('Table.score')}</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.slice(0, 12).map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.url}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(row.fetched_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{Number(row.global_score).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
