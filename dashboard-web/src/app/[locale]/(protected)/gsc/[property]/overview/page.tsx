import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { getGscDataset, normalizeDomain } from '@/lib/gsc/generator';
import { MetricCards } from '../../_components/MetricCards';
import { TimeSeriesChart } from '../../_components/TimeSeriesChart';
import { parseRangeParam } from '../../_lib/range';

type Props = {
  params: Promise<{ property: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OverviewPage({ params, searchParams }: Props) {
  const { property } = await params;
  const search = await searchParams;
  const range = parseRangeParam(search.range);

  const dataset = await getGscDataset(normalizeDomain(decodeURIComponent(property)), range);

  const t = await getTranslations('GSC.Overview');
  const labels = {
    clicks: t('metrics.clicks'),
    impressions: t('metrics.impressions'),
    ctr: t('metrics.ctr'),
    position: t('metrics.position'),
  };

  return (
    <div className="space-y-4">
      <MetricCards totals={dataset.totals} previous={dataset.previousPeriodTotals} labels={labels} />
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-medium">{t('timeSeriesTitle')}</h2>
          <TimeSeriesChart
            series={dataset.series}
            labels={{ clicks: labels.clicks, impressions: labels.impressions }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
