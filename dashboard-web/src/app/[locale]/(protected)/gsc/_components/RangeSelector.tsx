'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { GscRange } from '@/lib/gsc/types';

interface RangeSelectorProps {
  current: GscRange;
  labels: Record<GscRange, string>;
}

/**
 * URL-driven range selector. Writes `?range=` so the page is shareable.
 * `router.replace` keeps the browser history clean across toggles.
 */
export function RangeSelector({ current, labels }: RangeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const onChange = (value: string) => {
    if (!value) return; // empty when user deselects — toggle-group quirk
    const next = new URLSearchParams(params);
    next.set('range', value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <ToggleGroup
      type="single"
      value={String(current)}
      onValueChange={onChange}
      aria-label="Date range"
    >
      <ToggleGroupItem value="7">{labels[7]}</ToggleGroupItem>
      <ToggleGroupItem value="28">{labels[28]}</ToggleGroupItem>
      <ToggleGroupItem value="90">{labels[90]}</ToggleGroupItem>
    </ToggleGroup>
  );
}
