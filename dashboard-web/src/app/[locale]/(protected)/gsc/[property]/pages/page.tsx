import { getTranslations } from 'next-intl/server';
import { getGscDataset, normalizeDomain } from '@/lib/gsc/generator';
import { DimensionTable } from '../../_components/DimensionTable';
import { parseRangeParam } from '../../_lib/range';

type Props = {
  params: Promise<{ property: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PagesPage({ params, searchParams }: Props) {
  const { property } = await params;
  const search = await searchParams;
  const range = parseRangeParam(search.range);

  const dataset = await getGscDataset(
    normalizeDomain(decodeURIComponent(property)),
    range,
  );

  const tOverview = await getTranslations('GSC.Overview');
  const tPages = await getTranslations('GSC.Pages');

  return (
    <DimensionTable
      rows={dataset.pages}
      dimensionLabel={tPages('header')}
      metricLabels={{
        clicks: tOverview('metrics.clicks'),
        impressions: tOverview('metrics.impressions'),
        ctr: tOverview('metrics.ctr'),
        position: tOverview('metrics.position'),
      }}
      renderKey={(path) => <code className="text-xs">{path}</code>}
    />
  );
}
