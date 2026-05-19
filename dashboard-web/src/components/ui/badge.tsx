import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        // `tier`: badge de nivel/plan — uppercase tracked, ghost con tinte primary.
        // Uso: user pill ("NIVEL EMPRESARIAL"), planes en pricing.
        tier:
          'border-primary/30 bg-primary/10 text-primary uppercase tracking-tracked-label text-[10px] font-semibold',
        // `metricUp` / `metricDown`: variantes de Badge para deltas inline en
        // tablas / listas donde no entra un TrendPill con icono.
        metricUp:
          'border-transparent bg-emerald-500/10 text-emerald-400 dark:text-emerald-300 nums-tabular',
        metricDown:
          'border-transparent bg-rose-500/10 text-rose-400 dark:text-rose-300 nums-tabular',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
