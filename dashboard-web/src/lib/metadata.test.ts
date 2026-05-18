import { describe, it, expect } from 'vitest';
import { buildMetadata, localizedUrl } from './metadata';

describe('localizedUrl', () => {
  it('default locale (es) sin prefijo en home', () => {
    expect(localizedUrl('es', '/')).toBe('https://test.example.com');
  });

  it('default locale (es) sin prefijo en sub-ruta', () => {
    expect(localizedUrl('es', '/audit')).toBe('https://test.example.com/audit');
  });

  it('non-default locale (en) con prefijo en home', () => {
    expect(localizedUrl('en', '/')).toBe('https://test.example.com/en');
  });

  it('non-default locale (en) con prefijo en sub-ruta', () => {
    expect(localizedUrl('en', '/audit')).toBe(
      'https://test.example.com/en/audit',
    );
  });

  it('normaliza path sin leading slash', () => {
    expect(localizedUrl('es', 'audit')).toBe('https://test.example.com/audit');
  });

  it('no genera doble slash si el path es "/"', () => {
    expect(localizedUrl('en', '/')).not.toContain('//en');
  });
});

describe('buildMetadata', () => {
  const baseInput = {
    locale: 'es' as const,
    path: '/' as const,
    title: 'Test Title',
    description: 'Test description que tiene una longitud razonable.',
  };

  it('incluye canonical apuntando al locale actual', () => {
    const m = buildMetadata(baseInput);
    expect(m.alternates?.canonical).toBe('https://test.example.com');
  });

  it('genera hreflang por cada locale soportado', () => {
    const m = buildMetadata(baseInput);
    expect(m.alternates?.languages).toMatchObject({
      es: 'https://test.example.com',
      en: 'https://test.example.com/en',
    });
  });

  it('incluye x-default apuntando al default locale URL', () => {
    const m = buildMetadata(baseInput);
    expect(m.alternates?.languages?.['x-default']).toBe(
      'https://test.example.com',
    );
  });

  it('canonical para EN usa prefijo /en', () => {
    const m = buildMetadata({ ...baseInput, locale: 'en' });
    expect(m.alternates?.canonical).toBe('https://test.example.com/en');
  });

  it('robots queda noindex cuando ALLOW_INDEXING=false (default en tests)', () => {
    const m = buildMetadata(baseInput);
    expect(m.robots).toMatchObject({ index: false, follow: false });
  });

  it('openGraph contiene siteName, locale, type website', () => {
    const m = buildMetadata(baseInput);
    expect(m.openGraph).toMatchObject({
      siteName: 'SEO Custom Tool',
      locale: 'es',
      type: 'website',
    });
  });

  it('twitter usa summary_large_image', () => {
    const m = buildMetadata(baseInput);
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('title y description se propagan a openGraph y twitter', () => {
    const m = buildMetadata(baseInput);
    expect(m.openGraph).toMatchObject({
      title: baseInput.title,
      description: baseInput.description,
    });
    expect(m.twitter).toMatchObject({
      title: baseInput.title,
      description: baseInput.description,
    });
  });

  it('respeta ogImage cuando se provee', () => {
    const m = buildMetadata({ ...baseInput, ogImage: '/og-custom.png' });
    expect(m.openGraph?.images).toEqual([{ url: '/og-custom.png' }]);
    expect(m.twitter?.images).toEqual(['/og-custom.png']);
  });
});
