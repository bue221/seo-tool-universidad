import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { getGscDataset, normalizeDomain } from '@/lib/gsc/generator';
import { DevicesDonut } from '../../_components/DevicesDonut';
import { parseRangeParam } from '../../_lib/range';

type Props = {
  params: Promise<{ property: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DevicesPage({ params, searchParams }: Props) {
  const { property } = await params;
  const search = await searchParams;
  const range = parseRangeParam(search.range);

  const dataset = await getGscDataset(
    normalizeDomain(decodeURIComponent(property)),
    range,
  );

  const t = await getTranslations('GSC.Devices');
  const labels = {
    mobile: t('mobile'),
    desktop: t('desktop'),
    tablet: t('tablet'),
  } as const;

  return (
    <Card>
      <CardContent className="p-6">
        <DevicesDonut rows={dataset.devices} labels={labels} />
      </CardContent>
    </Card>
  );
}
