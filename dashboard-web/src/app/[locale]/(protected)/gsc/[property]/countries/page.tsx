import { getTranslations } from 'next-intl/server';
import { getGscDataset, normalizeDomain } from '@/lib/gsc/generator';
import { DimensionTable } from '../../_components/DimensionTable';
import { flagFor } from '../../_lib/flags';
import { parseRangeParam } from '../../_lib/range';

type Props = {
  params: Promise<{ property: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CountriesPage({ params, searchParams }: Props) {
  const { property } = await params;
  const search = await searchParams;
  const range = parseRangeParam(search.range);

  const dataset = await getGscDataset(
    normalizeDomain(decodeURIComponent(property)),
    range,
  );

  const tOverview = await getTranslations('GSC.Overview');
  const tCountries = await getTranslations('GSC.Countries');

  // Map countries onto the generic DimensionTable shape: country name as
  // the visible key, flag prefix via `renderKey`.
  const rows = dataset.countries.map((c) => ({
    key: `${c.countryCode}|${c.countryName}`,
    clicks: c.clicks,
    impressions: c.impressions,
    ctr: c.ctr,
    position: c.position,
  }));

  return (
    <DimensionTable
      rows={rows}
      dimensionLabel={tCountries('header')}
      metricLabels={{
        clicks: tOverview('metrics.clicks'),
        impressions: tOverview('metrics.impressions'),
        ctr: tOverview('metrics.ctr'),
        position: tOverview('metrics.position'),
      }}
      renderKey={(composite) => {
        const [code, name] = composite.split('|');
        return (
          <span className="flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden>{flagFor(code ?? '')}</span>
            <span>{name}</span>
            <span className="text-xs text-muted-foreground">{code}</span>
          </span>
        );
      }}
    />
  );
}
