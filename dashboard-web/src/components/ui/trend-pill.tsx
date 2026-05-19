import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * TrendPill — píldora compacta para mostrar delta + dirección.
 *
 * Render: `[ ↗  +14.2% ]` en verde (up) / `[ ↘  −0.4% ]` en rojo (down) /
 * `[ —  0% ]` en gris (flat).
 *
 * - `direction`: `up | down | flat`. Determina color e icono.
 * - `delta`: string ya formateado (con signo y unidad). El componente NO formatea
 *   números — la decisión de "+14.2%" vs "14.2 ↑" es del consumidor.
 * - `aria-label` automático para lectores de pantalla; sobreescribible vía prop.
 *
 * Diseño: pill `rounded-full px-2 py-0.5 text-xs` con fondo tintado al 10-15%.
 */
type Direction = 'up' | 'down' | 'flat';

interface TrendPillProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  direction: Direction;
  delta: string;
  /** Sobreescribe el aria-label autogenerado. */
  label?: string;
}

const directionStyles: Record<Direction, { cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  up: {
    cls: 'bg-emerald-500/10 text-emerald-400 dark:text-emerald-300',
    icon: ArrowUpRight,
  },
  down: {
    cls: 'bg-rose-500/10 text-rose-400 dark:text-rose-300',
    icon: ArrowDownRight,
  },
  flat: {
    cls: 'bg-muted text-muted-foreground',
    icon: Minus,
  },
};

const directionLabel: Record<Direction, string> = {
  up: 'incremento',
  down: 'descenso',
  flat: 'sin cambio',
};

export function TrendPill({
  direction,
  delta,
  label,
  className,
  ...props
}: TrendPillProps) {
  const { cls, icon: Icon } = directionStyles[direction];
  return (
    <span
      role="status"
      aria-label={label ?? `${directionLabel[direction]} de ${delta}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium nums-tabular',
        cls,
        className,
      )}
      {...props}
    >
      <Icon className="size-3" aria-hidden="true" />
      {delta}
    </span>
  );
}
