import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Aplica a todo EXCEPTO:
  // - /api/*           (rutas no localizadas)
  // - /_next/*         (assets de Next)
  // - /_vercel/*       (telemetría)
  // - rutas con punto  (favicon.ico, sitemap.xml, robots.txt, og-image.png, etc.)
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
