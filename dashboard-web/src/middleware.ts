import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request);
  const intlResponse = intlMiddleware(request);

  const response = intlResponse ?? NextResponse.next({ request });

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

export const config = {
  // Aplica a todo EXCEPTO:
  // - /api/*           (rutas no localizadas)
  // - /_next/*         (assets de Next)
  // - /_vercel/*       (telemetría)
  // - rutas con punto  (favicon.ico, sitemap.xml, robots.txt, og-image.png, etc.)
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
