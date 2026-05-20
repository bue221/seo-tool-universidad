import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

export const alt = 'LumoSEO — Hacé medible tu visibilidad SEO';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OpengraphImage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;

  const t = await getTranslations({ locale, namespace: 'Landing' });
  const tc = await getTranslations({ locale, namespace: 'Common' });

  const headline =
    locale === 'es'
      ? { plain: 'Hacé medible tu', accent: 'visibilidad SEO' }
      : { plain: 'Measure your', accent: 'SEO visibility' };

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(135deg, #0d1a14 0%, #0f2018 55%, #091510 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Glow blobs */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -60,
            width: 420,
            height: 420,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(74,222,128,0.16) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: 160,
            width: 340,
            height: 340,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
          }}
        />

        {/* LEFT — main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '72px 60px 72px 80px',
            flex: '1 1 0',
            gap: '0px',
          }}
        >
          {/* Brand badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 36,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 800,
                color: '#0d1a14',
                boxShadow: '0 0 28px rgba(74,222,128,0.45)',
              }}
            >
              L
            </div>
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: '#f0fdf4',
                letterSpacing: '-0.01em',
              }}
            >
              {tc('appName')}
            </span>
          </div>

          {/* Headline — plain + accent */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: 24,
              gap: 0,
            }}
          >
            <span
              style={{
                fontSize: 68,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.07,
                color: '#f0fdf4',
              }}
            >
              {headline.plain}
            </span>
            <span
              style={{
                fontSize: 68,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.07,
                color: '#4ade80',
              }}
            >
              {headline.accent}
            </span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 24,
              fontWeight: 400,
              color: '#6b9e78',
              maxWidth: 640,
              lineHeight: 1.45,
              marginBottom: 44,
            }}
          >
            {t('subtitle')}
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 10 }}>
            {['PageSpeed', 'Scraper', 'Keywords', 'Análisis'].map((label) => (
              <div
                key={label}
                style={{
                  padding: '9px 18px',
                  borderRadius: 999,
                  border: '1px solid rgba(74,222,128,0.25)',
                  background: 'rgba(74,222,128,0.07)',
                  color: '#4ade80',
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — score card mock */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '72px 80px 72px 20px',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 228,
              height: 228,
              borderRadius: 28,
              border: '1px solid rgba(74,222,128,0.22)',
              background: 'rgba(74,222,128,0.05)',
              gap: 6,
              boxShadow: '0 0 40px rgba(74,222,128,0.08)',
            }}
          >
            <div
              style={{
                fontSize: 17,
                color: '#6b9e78',
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              SEO Score
            </div>
            <div
              style={{
                fontSize: 92,
                fontWeight: 800,
                color: '#4ade80',
                letterSpacing: '-0.05em',
                lineHeight: 1,
              }}
            >
              94
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
              <div style={{ width: 28, height: 5, borderRadius: 3, background: '#4ade80' }} />
              <div style={{ width: 28, height: 5, borderRadius: 3, background: '#4ade80' }} />
              <div style={{ width: 28, height: 5, borderRadius: 3, background: '#4ade80' }} />
              <div style={{ width: 28, height: 5, borderRadius: 3, background: '#4ade80' }} />
              <div style={{ width: 28, height: 5, borderRadius: 3, background: 'rgba(74,222,128,0.3)' }} />
            </div>
          </div>
          <span style={{ fontSize: 17, color: '#3d5c42' }}>lumo.seo</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
