import * as React from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/section-label';
import { cn } from '@/lib/utils';

/**
 * SectionCard — wrapper estándar de secciones internas de página.
 *
 * Rediseño "command center": usa Card variant="surface" (radius 2xl,
 * surface-2/80 fill, hairline border) y un header con SectionLabel uppercase
 * tracked como eyebrow + título principal opcional.
 *
 * API:
 * - `title`: título principal del card (text-base font-semibold).
 * - `eyebrow`: SectionLabel uppercase sobre el título (opcional).
 * - `description`: subtítulo gris muted.
 * - `actions`: slot derecha del header.
 *
 * Backwards compatible: consumidores que solo pasan `title` ven el restyling
 * sin cambios de API.
 */
interface SectionCardProps {
  title?: string;
  eyebrow?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({
  title,
  eyebrow,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  const hasHeader = title || eyebrow || description || actions;
  return (
    <Card variant="surface" className={cn('overflow-hidden', className)}>
      {hasHeader && (
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}
            {title && (
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={cn(hasHeader ? 'pt-0' : 'p-6', bodyClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
