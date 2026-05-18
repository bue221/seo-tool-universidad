import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/**
 * Genera /robots.txt dinámicamente.
 *
 * Regla:
 *   - prod (NEXT_PUBLIC_ALLOW_INDEXING=true) → permite todo y referencia sitemap.
 *   - cualquier otro ambiente              → Disallow: /
 *
 * Por qué condicional en vez de hardcodear allow:
 *   Es muy común que previews de Vercel se indexen y empiecen a competir
 *   con producción en SERPs. Default-noindex previene ese pie de tabla.
 */
export default function robots(): MetadataRoute.Robots {
  if (!env.NEXT_PUBLIC_ALLOW_INDEXING) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
    host: env.NEXT_PUBLIC_SITE_URL,
  };
}
