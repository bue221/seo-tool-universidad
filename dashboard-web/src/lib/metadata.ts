import type { Metadata } from 'next';
import { routing, type Locale } from '@/i18n/routing';
import { env } from './env';

/**
 * Construye la URL pública para un (locale, path) respetando `localePrefix: 'as-needed'`.
 *
 *   localizedUrl('es', '/audit') → https://site.com/audit
 *   localizedUrl('en', '/audit') → https://site.com/en/audit
 *   localizedUrl('es', '/')      → https://site.com
 *   localizedUrl('en', '/')      → https://site.com/en
 */
export function localizedUrl(locale: Locale, path: string): string {
  const base = env.NEXT_PUBLIC_SITE_URL;
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `${base}${prefix}${normalized}` || base;
}

type BuildMetadataInput = {
  locale: Locale;
  /** Path canonical sin prefijo de locale, ej. `/audit/foo`. Use `/` para home. */
  path: string;
  title: string;
  description: string;
  /** Path absoluto a la imagen OG, default: ImageResponse generada por locale. */
  ogImage?: string;
};

/**
 * Genera metadata Next.js completa para una página pública:
 *   - title (sin sufijo — el template global del layout lo añade).
 *   - alternates.canonical apuntando al locale actual.
 *   - alternates.languages con hreflang por locale + x-default.
 *   - openGraph + twitter (summary_large_image).
 *   - robots respeta NEXT_PUBLIC_ALLOW_INDEXING.
 */
export function buildMetadata({
  locale,
  path,
  title,
  description,
  ogImage,
}: BuildMetadataInput): Metadata {
  const canonical = localizedUrl(locale, path);

  // hreflang: una entrada por locale + x-default → default locale URL.
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = localizedUrl(loc, path);
  }
  languages['x-default'] = localizedUrl(routing.defaultLocale, path);

  const indexable = env.NEXT_PUBLIC_ALLOW_INDEXING;

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'SEO Custom Tool',
      locale,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
