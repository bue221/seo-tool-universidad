import * as React from 'react';

import { GradientHeading } from '@/components/ui/gradient-heading';
import { cn } from '@/lib/utils';

/**
 * PageHeader — header estándar de cada página protegida y de marketing.
 *
 * API:
 * - `title`: string base del heading (texto plano).
 * - `accent`: palabra-acento opcional. Si se pasa, se renderiza con gradient
 *   primary → accent vía GradientHeading. Patrón "Comando NEXUS",
 *   "Auditoría SEO", "Monitoreo de KEYWORDS".
 * - `description`: subtítulo gris medio.
 * - `actions`: slot derecha (botones, time-range tabs, export).
 * - `size`: `lg` (default, hero de página) | `sm` (sub-página, tab interna).
 *
 * Backwards compatibility: las páginas que pasan solo `title` siguen
 * funcionando — solo cambia el font + tracking.
 */
interface PageHeaderProps {
  title: string;
  accent?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'lg' | 'sm';
  className?: string;
}

export function PageHeader({
  title,
  accent,
  description,
  actions,
  size = 'lg',
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="space-y-2">
        <GradientHeading as="h1" size={size} accent={accent}>
          {title}
        </GradientHeading>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
