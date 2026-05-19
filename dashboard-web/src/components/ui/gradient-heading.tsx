import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * GradientHeading — Heading display con palabra-acento en gradient de marca.
 *
 * Patrón visual de las refs "command center":
 *
 *   COMANDO **NEXUS**     ← "NEXUS" en gradient primary → accent
 *   MONITOREO DE **KEYWORDS SERP**
 *
 * Uso:
 *   <GradientHeading accent="Nexus">Comando</GradientHeading>
 *   <GradientHeading accent="Keywords SERP" as="h2" size="sm">
 *     Monitoreo de
 *   </GradientHeading>
 *
 * - `as`: tag semántico (default `h1`).
 * - `size`: `lg` (display ~clamp 2.5-4.5rem) | `sm` (display-sm).
 * - `accent`: string o ReactNode renderizado como `<span>` con gradient.
 *
 * Si no se pasa `accent`, el componente sigue renderizando el children plano —
 * útil para no romper consumidores que migren progresivamente.
 */
type Size = 'lg' | 'sm';
type Tag = 'h1' | 'h2' | 'h3';

interface GradientHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: Tag;
  size?: Size;
  accent?: React.ReactNode;
}

const sizeClasses: Record<Size, string> = {
  lg: 'text-display',
  sm: 'text-display-sm',
};

export function GradientHeading({
  as: Comp = 'h1',
  size = 'lg',
  accent,
  className,
  children,
  ...props
}: GradientHeadingProps) {
  return (
    <Comp
      className={cn(
        'font-display text-foreground',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
      {accent != null && (
        <>
          {children != null && ' '}
          <span className="text-gradient-brand">{accent}</span>
        </>
      )}
    </Comp>
  );
}
