import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { localizedUrl } from '@/lib/metadata';

/**
 * Rutas públicas indexables. Cada item se expande automáticamente con
 * `alternates.languages` por locale — crítico para SEO multilingüe.
 *
 * Agregar nuevas rutas acá conforme se construyen pages públicas en
 * `app/[locale]/<ruta>/page.tsx`.
 */
const PUBLIC_PATHS = ['/'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PATHS.map((path) => {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = localizedUrl(locale, path);
    }

    return {
      url: localizedUrl(routing.defaultLocale, path),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: path === '/' ? 1 : 0.7,
      alternates: { languages },
    };
  });
}
