import type { MetadataRoute } from 'next';

/**
 * PWA manifest expuesto en /manifest.webmanifest.
 *
 * Colores alineados con tokens light de globals.css:
 *   theme_color      = hsl(0 0% 100%)       → fondo light
 *   background_color = hsl(0 0% 100%)       → mismo (evita flash en splash)
 *
 * Cuando se haga rebrand, sincronizar con `--background` y `--primary` allí.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SEO Custom Tool',
    short_name: 'SEO Tool',
    description:
      'Herramienta de auditoría SEO con scraping profundo, Insights y análisis competitivo.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        // Next.js sirve el icon.tsx en esta ruta convencional.
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
