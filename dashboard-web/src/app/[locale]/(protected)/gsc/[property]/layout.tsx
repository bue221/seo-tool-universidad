import { getTranslations } from 'next-intl/server';
import { ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { RangeSelector } from '../_components/RangeSelector';
import { assertUserOwnsProperty } from '../_lib/properties';
import { parseRangeParam } from '../_lib/range';
import type { GscRange } from '@/lib/gsc/types';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; property: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Layout for every `/gsc/[property]/*` route. Resolves ownership once,
 * renders the breadcrumb back-link, the sub-nav tabs and the range
 * selector. The actual data fetching happens per-page so each tab can
 * load only what it needs.
 */
export default async function PropertyLayout({ children, params, searchParams }: Props) {
  const { property } = await params;
  const search = await searchParams;
  const range = parseRangeParam(search.range);

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
        <RangeSelector current={range} labels={labels} />
      </div>

      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('property')}</p>
        <h1 className="truncate text-2xl font-semibold tracking-tight">{normalized}</h1>
      </header>

      <PropertyTabs property={property} range={range} />

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

async function PropertyTabs({ property, range }: { property: string; range: GscRange }) {
  const t = await getTranslations('GSC.Tabs');
  const qs = `?range=${range}`;
  const base = `/gsc/${property}`;
  const tabs: Array<{ key: string; href: string; label: string }> = [
    { key: 'overview', href: `${base}/overview${qs}`, label: t('overview') },
    { key: 'queries', href: `${base}/queries${qs}`, label: t('queries') },
    { key: 'pages', href: `${base}/pages${qs}`, label: t('pages') },
    { key: 'devices', href: `${base}/devices${qs}`, label: t('devices') },
    { key: 'countries', href: `${base}/countries${qs}`, label: t('countries') },
  ];
  return (
    <nav
      aria-label="Property sections"
      className="inline-flex items-center gap-1 overflow-x-auto rounded-md bg-muted p-1 text-sm text-muted-foreground"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className="whitespace-nowrap rounded-sm px-3 py-1.5 font-medium transition-colors hover:bg-background/60 hover:text-foreground"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
