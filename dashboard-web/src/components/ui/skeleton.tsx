import { cn } from '@/lib/utils';

/**
 * Skeleton placeholder con shimmer (sweep horizontal de luz).
 *
 * Implementaci\u00f3n CSS-only:
 *   - fondo `bg-muted` para la silueta base.
 *   - `::after` pseudo via `bg-gradient-to-r` que se desplaza con `animate-shimmer`.
 *   - `bg-[length:200%_100%]` da espacio al gradient para barrer sin loopear visible.
 *
 * Reemplaza el `animate-pulse` plano que se sent\u00eda gen\u00e9rico.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted',
        // El sweep es un overlay absoluto; usamos `before` para no requerir wrapper.
        'before:absolute before:inset-0 before:animate-shimmer',
        'before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent',
        'before:bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
