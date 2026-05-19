import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * SectionLabel — eyebrow uppercase tracked.
 *
 * Uso: encabezar grupos en sidebar ("COMANDO"), secciones de marketing
 * ("PLATAFORMA"), o cards ("KPIs"). Por defecto color `primary/80` para que
 * funcione como ancla visual de marca sin competir con headings.
 *
 * Variants:
 * - `primary` (default): tinte lime.
 * - `muted`: gris, para labels secundarias / metadata.
 */
type Variant = 'primary' | 'muted';

interface SectionLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  as?: 'span' | 'p' | 'div';
}

const variantClasses: Record<Variant, string> = {
  primary: 'text-primary/80',
  muted: 'text-muted-foreground',
};

export function SectionLabel({
  className,
  variant = 'primary',
  as: Comp = 'span',
  ...props
}: SectionLabelProps) {
  return (
    <Comp
      className={cn(
        'text-xs font-semibold uppercase tracking-tracked-label',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
