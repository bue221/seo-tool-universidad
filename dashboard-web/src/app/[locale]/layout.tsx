import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { JsonLd, buildSiteSchemas } from '@/components/seo/JsonLd';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
import '@/styles/globals.css';

/**
 * Metadata global heredada por todas las páginas del segmento [locale].
 * - `metadataBase` permite que `openGraph.images` y `alternates.canonical`
 *   sean rutas relativas (Next las resuelve absolutas usando esta base).
 * - `title.template` aplica a cualquier page que defina su propio title corto.
 */
export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'SEO Custom Tool',
    template: '%s | SEO Custom Tool',
  },
  description:
    'Herramienta de auditoría SEO con scraping profundo, Insights y análisis competitivo.',
  applicationName: 'SEO Custom Tool',
  authors: [{ name: 'cplaza' }],
  robots: env.NEXT_PUBLIC_ALLOW_INDEXING
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

/**
 * Pre-genera rutas estáticas para cada locale soportado.
 * Habilita SSG total cuando la página interior también es estática.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Locales no soportados → 404 (no fallback silencioso).
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Debe llamarse ANTES de cualquier hook de next-intl. Activa renderizado estático.
  setRequestLocale(locale);

  // Mensajes para los Client Components descendientes.
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <JsonLd schema={buildSiteSchemas()} />
      </head>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          </NextIntlClientProvider>
          <Toaster richColors closeButton position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
