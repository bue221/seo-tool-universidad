import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases condicionales (`clsx`) y resuelve conflictos de Tailwind
 * (`tailwind-merge`).
 *
 * Sin `twMerge`, este input:
 *   cn('p-2 text-sm', isLarge && 'p-4')
 * produce `'p-2 text-sm p-4'`, donde `p-2` aún está presente. `twMerge`
 * lo limpia a `'text-sm p-4'`.
 *
 * Es el helper canónico de Shadcn — todos los componentes UI lo usan.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
