'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Wrap del Toaster de sonner que sincroniza su tema con next-themes.
 *
 * El theme prop acepta 'light' | 'dark' | 'system'. Cuando se usa "class"
 * attribute en next-themes, `theme` viene como string, así que casteamos
 * con tipo seguro.
 *
 * Las classNames están ligadas a tokens Shadcn — los toasts respetan
 * automáticamente el color scheme activo.
 */
export function Toaster(props: ToasterProps) {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}
