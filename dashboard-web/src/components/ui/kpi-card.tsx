import * as React from 'react';

import { cn } from '@/lib/utils';
import { IconBadge, type iconBadgeVariants } from './icon-badge';
import { TrendPill } from './trend-pill';
import type { VariantProps } from 'class-variance-authority';

/**
 * KpiCard — tile industrial para mostrar una métrica única.
 *
 * Estructura:
 *   ┌──────────────────────────────────────┐
 *   │ [icon]                  [trend pill] │
 *   │                                       │
 *   │ LABEL UPPERCASE TRACKED               │
 *   │ 12,450                                │
 *   │ vs mes anterior                       │
 *   └──────────────────────────────────────┘
 *
 * Props:
 * - `icon`: ReactNode (típicamente un icono lucide). Se renderiza en IconBadge.
 * - `iconVariant`: color de la caja del icono (primary | accent | neutral | ...).
 * - `label`: texto uppercase tracked superior al value.
 * - `value`: ReactNode — el valor principal (string, número formateado, JSX).
 * - `trend`: opcional, pill verde/rojo top-right.
 * - `hint`: texto auxiliar debajo del value (e.g. "vs mes anterior").
 * - `as`: tag wrapper (default `div`). Si se quiere clickeable, pasar `<a>` con
 *    href via cloneElement en el consumer o envolver con Link.
 *
 * Composición visual:
 * - Radius 2xl (1.25rem), border hairline, fondo surface-2/80 con backdrop.
 * - Sombra `shadow-card` (en dark = inset hairline; en light = drop suave).
 * - Hover sube tono de fondo a surface-3/80 sin levitar (mantiene el aire técnico).
 */
type IconVariant = NonNullable<VariantProps<typeof iconBadgeVariants>['variant']>;

interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  iconVariant?: IconVariant;
  label: string;
  value: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    delta: string;
  };
  hint?: React.ReactNode;
}

export function KpiCard({
  icon,
  iconVariant = 'primary',
  label,
  value,
  trend,
  hint,
  className,
  ...props
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col gap-6 rounded-2xl border border-border/60 bg-surface-2/80 p-6 shadow-card backdrop-blur-sm',
        'transition-colors duration-200 hover:bg-surface-3/80 hover:border-border',
        className,
      )}
      {...props}
    >
      {(icon || trend) && (
        <div className="flex items-start justify-between gap-3">
          {icon ? <IconBadge variant={iconVariant} size="md">{icon}</IconBadge> : <span />}
          {trend && <TrendPill direction={trend.direction} delta={trend.delta} />}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-tracked-label text-muted-foreground">
          {label}
        </span>
        <span className="text-4xl font-bold leading-none text-foreground nums-tabular">
          {value}
        </span>
        {hint && (
          <span className="mt-1 text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
    </div>
  );
}
