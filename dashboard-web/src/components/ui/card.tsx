import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Card primitive.
 *
 * `interactive`: aplica hover-lift (translate -2px) + shadow ramp soft → card.
 * Usar en cualquier card que sea link, button o tenga acción principal al click.
 * No usar en cards puramente informativas (hover sin feedback confunde).
 */
/**
 * Variants:
 * - `default`: card estándar con bg-card/80 + shadow-soft. Compatible con el
 *    look pre-command-center (no rompe consumidores existentes).
 * - `surface`: card command-center — surface-2/80, border/60, shadow-card,
 *    radius 2xl. Útil para KPIs, charts, secciones de detalle.
 * - `elevated`: surface-3 + shadow-pop, sin backdrop. Para modales inline /
 *    cards con peso visual extra.
 * - `ghost`: sin bg ni border, solo padding. Para wrappers que solo aportan
 *    estructura semántica.
 */
type CardVariant = 'default' | 'surface' | 'elevated' | 'ghost';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  variant?: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  default:
    'rounded-lg border border-border/60 bg-card/80 text-card-foreground shadow-soft backdrop-blur-sm',
  surface:
    'rounded-2xl border border-border/60 bg-surface-2/80 text-card-foreground shadow-card backdrop-blur-sm',
  elevated:
    'rounded-2xl border border-border bg-surface-3 text-card-foreground shadow-pop',
  ghost: 'rounded-2xl text-card-foreground',
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        variantClasses[variant],
        'transition-all duration-200',
        interactive &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-border hover:shadow-card',
        interactive && variant === 'default' && 'hover:bg-card',
        interactive && variant === 'surface' && 'hover:bg-surface-3/80',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
