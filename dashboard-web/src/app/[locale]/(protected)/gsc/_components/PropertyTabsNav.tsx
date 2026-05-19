'use client';

import { useSearchParams } from 'next/navigation';

import { Link } from '@/i18n/navigation';

import { parseRangeParam } from '../_lib/range';

type PropertyTabsLabels = {
  overview: string;
  queries: string;
  pages: string;
  devices: string;
  countries: string;
};

export function PropertyTabsNav({
  property,
  labels,
}: {
  property: string;
  labels: PropertyTabsLabels;
}) {
  const searchParams = useSearchParams();
  const range = parseRangeParam(searchParams.get('range') ?? undefined);
  const qs = `?range=${range}`;
  const base = `/gsc/${property}`;
  const tabs: Array<{ key: keyof PropertyTabsLabels; href: string; label: string }> = [
    { key: 'overview', href: `${base}/overview${qs}`, label: labels.overview },
    { key: 'queries', href: `${base}/queries${qs}`, label: labels.queries },
    { key: 'pages', href: `${base}/pages${qs}`, label: labels.pages },
    { key: 'devices', href: `${base}/devices${qs}`, label: labels.devices },
    { key: 'countries', href: `${base}/countries${qs}`, label: labels.countries },
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
