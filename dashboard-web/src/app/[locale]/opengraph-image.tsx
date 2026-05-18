import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

export const alt = 'SEO Custom Tool';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * OG image generada por locale en build time.
 *
 * Por qué ImageResponse y no un PNG estático:
 *   - Cero binarios en el repo.
 *   - Texto traducido por idioma sin tener que mantener N archivos.
 *   - Cambios de marca = editar este archivo, no re-exportar Figma.
 */
export default async function OpengraphImage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;

  const t = await getTranslations({ locale, namespace: 'Common' });

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          {t('appName')}
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 400,
            lineHeight: 1.3,
            maxWidth: 900,
            color: '#94a3b8',
          }}
        >
          {t('tagline')}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            right: 80,
            fontSize: 22,
            color: '#475569',
            fontFamily: 'monospace',
          }}
        >
          {locale.toUpperCase()}
        </div>
      </div>
    ),
    { ...size },
  );
}
