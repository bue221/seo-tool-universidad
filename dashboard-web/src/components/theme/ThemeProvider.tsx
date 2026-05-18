'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof NextThemesProvider>;

/**
 * Wrap del ThemeProvider de next-themes como Client Component.
 *
 * Defaults usados en `app/[locale]/layout.tsx`:
 *   - attribute="class"      → next-themes muta `<html class="dark">` o `<html class="light">`.
 *   - defaultTheme="system"  → respeta `prefers-color-scheme` del OS al primer load.
 *   - enableSystem           → habilita la opción "system" en el toggle.
 *
 * El script bloqueante de next-themes se inyecta en `<head>` automáticamente
 * y aplica la clase ANTES del primer paint → cero FOUC.
 */
export function ThemeProvider(props: Props) {
  return <NextThemesProvider {...props} />;
}
