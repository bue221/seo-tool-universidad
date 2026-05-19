import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * IconBadge — caja cuadrada tintada para alojar un icono lucide.
 *
 * Usado en KpiCard (top-left), sidebar items collapsed, hero de secciones.
 * El icono se pasa como children. Tamaño del icono se controla con la prop
 * `size` (afecta padding y dimensión del slot).
 *
 * Variants de color:
 * - `primary`: bg primary/10, icon primary
 * - `accent`:  bg accent/12, icon accent
 * - `neutral`: bg surface-3, icon muted-foreground
 * - `success`: emerald/10
 * - `warning`: amber/10
 * - `danger`:  destructive/12
 */
const iconBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-xl shrink-0 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary/10 text-primary [&_svg]:text-primary',
        accent: 'bg-accent/15 text-accent [&_svg]:text-accent',
        neutral:
          'bg-surface-3 text-muted-foreground [&_svg]:text-muted-foreground',
        success:
          'bg-emerald-500/10 text-emerald-400 [&_svg]:text-emerald-400 dark:text-emerald-300',
        warning:
          'bg-amber-500/10 text-amber-400 [&_svg]:text-amber-400 dark:text-amber-300',
        danger:
          'bg-destructive/15 text-destructive [&_svg]:text-destructive',
      },
      size: {
        sm: 'size-8 [&_svg]:size-4',
        md: 'size-10 [&_svg]:size-5',
        lg: 'size-12 [&_svg]:size-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface IconBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconBadgeVariants> {}

export function IconBadge({
  className,
  variant,
  size,
  children,
  ...props
}: IconBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(iconBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { iconBadgeVariants };
