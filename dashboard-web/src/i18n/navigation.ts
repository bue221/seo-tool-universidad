import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// IMPORTANTE: en componentes/páginas, importar Link/redirect/usePathname/useRouter
// desde este módulo (NO desde 'next/link' o 'next/navigation') — así las URLs
// respetan el prefijo de locale configurado en routing.ts.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
