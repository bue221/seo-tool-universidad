import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Rutas públicas (sin auth). Cualquier otra requiere sesión Clerk.
 *
 * Patrones:
 *   - `/` y `/{locale}` → landing pública.
 *   - `/{locale}/login(.*)` y `/{locale}/signup(.*)` → flujos Clerk (incl. sub-paths
 *     como `/login/factor-one`, `/login/sso-callback`).
 *   - `/api/*` ya está excluido por el `matcher` global, pero lo dejamos explícito
 *     para que cualquier futuro endpoint público quede cubierto.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/(es|en)',
  '/(es|en)/login(.*)',
  '/(es|en)/signup(.*)',
]);

/**
 * Composición:
 *   1) `clerkMiddleware` adjunta `auth()` al request y, si la ruta no es pública
 *      ni el usuario está autenticado, redirige a `NEXT_PUBLIC_CLERK_SIGN_IN_URL`.
 *   2) `intlMiddleware` reescribe/redirige según locale.
 *
 * Orden importante: Clerk primero para que la protección de ruta corra antes
 * de cualquier reescritura de URL por next-intl.
 */
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  return intlMiddleware(req);
});

export const config = {
  // Aplica a todo EXCEPTO:
  // - /api/*           (rutas no localizadas)
  // - /_next/*         (assets de Next)
  // - /_vercel/*       (telemetría)
  // - rutas con punto  (favicon.ico, sitemap.xml, robots.txt, og-image.png, etc.)
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
