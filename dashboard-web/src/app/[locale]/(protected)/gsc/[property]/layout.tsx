import { getTranslations } from 'next-intl/server';
import { ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { RangeSelector } from '../_components/RangeSelector';
import { PropertyTabsNav } from '../_components/PropertyTabsNav';
import { assertUserOwnsProperty } from '../_lib/properties';
import type { GscRange } from '@/lib/gsc/types';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; property: string }>;
};

/**
 * Layout for every `/gsc/[property]/*` route. Resolves ownership once,
 * renders the breadcrumb back-link, the sub-nav tabs and the range
 * selector. The actual data fetching happens per-page so each tab can
 * load only what it needs.
 */
export default async function PropertyLayout({ children, params }: Props) {
  const { property } = await params;

  const user = await getCurrentUser();
  if (!user) return null;

  // 404 if the property is not in this user's audit history.
  const decoded = decodeURIComponent(property);
  const normalized = await assertUserOwnsProperty(user.id, decoded);

  const t = await getTranslations('GSC.Common');
  const labels = await rangeLabels();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/gsc"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden /> {t('backToProperties')}
        </Link>
        <RangeSelector labels={labels} />
      </div>

      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('property')}</p>
        <h1 className="truncate text-2xl font-semibold tracking-tight">{normalized}</h1>
      </header>

      <PropertyTabsNav property={property} labels={await propertyTabLabels()} />

      {children}
    </div>
  );
}

async function rangeLabels(): Promise<Record<GscRange, string>> {
  const t = await getTranslations('GSC.Common');
  return {
    7: t('range7d'),
    28: t('range28d'),
    90: t('range90d'),
  };
}

async function propertyTabLabels() {
  const t = await getTranslations('GSC.Tabs');
  return {
    overview: t('overview'),
    queries: t('queries'),
    pages: t('pages'),
    devices: t('devices'),
    countries: t('countries'),
  };
}
