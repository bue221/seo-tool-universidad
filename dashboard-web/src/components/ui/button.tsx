import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // `transition-all` (no solo `transition-colors`) para que shadow/transform animen.
  // `active:scale-[0.98]` da feedback táctil al click sin coste de JS.
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary: gradient sutil top→bottom + sombra soft → glow on hover.
        // Mantiene legibilidad de `primary-foreground` (no usar `/90` aquí porque
        // rompe contraste del texto blanco en light theme).
        default:
          'bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-soft hover:shadow-glow hover:from-primary hover:to-primary',
        destructive:
          'bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90 hover:shadow-card',
        outline:
          'border border-input bg-background/60 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:shadow-soft',
        secondary:
          'bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/80 hover:shadow-card',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
