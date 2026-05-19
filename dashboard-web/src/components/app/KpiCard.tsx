import * as React from 'react';

import {
  KpiCard as KpiCardPrimitive,
} from '@/components/ui/kpi-card';
import type { iconBadgeVariants } from '@/components/ui/icon-badge';
import type { VariantProps } from 'class-variance-authority';

/**
 * App-level KpiCard — wrapper retro-compatible sobre el primitive ui/kpi-card.
 *
 * Mantiene la API histórica (`title`, `value`, `helper`) para no romper a los
 * consumidores existentes (dashboard, analytics, settings, onboarding), y
 * expone los nuevos slots opcionales del lenguaje "command center":
 *
 * - `icon`: ReactNode renderizado en IconBadge top-left.
 * - `iconVariant`: color del IconBadge (`primary`, `accent`, etc.).
 * - `trend`: `{ direction, delta }` → TrendPill top-right.
 *
 * Migración progresiva: las páginas pueden ir agregando `icon` + `trend`
 * sin tocar las que aún no las necesitan.
 */
type IconVariant = NonNullable<VariantProps<typeof iconBadgeVariants>['variant']>;

interface KpiCardProps {
  title: string;
  value: string;
  helper?: string;
  icon?: React.ReactNode;
  iconVariant?: IconVariant;
  trend?: { direction: 'up' | 'down' | 'flat'; delta: string };
  className?: string;
}

export function KpiCard({
  title,
  value,
  helper,
  icon,
  iconVariant,
  trend,
  className,
}: KpiCardProps) {
  return (
    <KpiCardPrimitive
      label={title}
      value={value}
      hint={helper}
      icon={icon}
      iconVariant={iconVariant}
      trend={trend}
      className={className}
    />
  );
}
