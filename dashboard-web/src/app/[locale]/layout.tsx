import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { enUS, esES } from '@clerk/localizations';
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
 * Inter variable — self-hosted vía next/font, sin request a Google en runtime.
 * `--font-sans` se inyecta como CSS var y se referencia desde tailwind.config.ts
 * (`fontFamily.sans` / `fontFamily.display`).
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

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
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <JsonLd schema={buildSiteSchemas()} />
      </head>
      <body className="bg-background font-sans text-foreground antialiased">
        {/*
         * ClerkProvider envuelve TODO porque sus hooks (useUser, useSession)
         * deben estar disponibles tanto en (auth) como en (protected).
         * `localization` se elige por locale activo: Clerk renderiza sus
         * componentes (SignIn/SignUp/UserButton) traducidos.
         */}
        {/*
         * Clerk appearance — mapeado a tokens del design system (PR-2 /
         * ui-cc-shell). Usamos solo `variables` (no `baseTheme`) para evitar
         * sumar `@clerk/themes` como dep; la rampa de surface + radius se
         * aplica de forma consistente con el resto de la app.
         *
         * Light vs dark: Clerk no consume CSS vars dinámicas, así que estos
         * valores reflejan la rampa DARK (modo primario del rediseño). En light
         * mode los formularios Clerk seguirán con fondo oscuro — trade-off
         * aceptable: login/signup priorizan look unificado del producto.
         */}
        <ClerkProvider
          localization={locale === 'es' ? esES : enUS}
          appearance={{
            variables: {
              colorPrimary: 'hsl(142 70% 55%)',
              colorBackground: 'hsl(150 22% 11%)',
              colorInputBackground: 'hsl(150 16% 14%)',
              colorInputText: 'hsl(140 25% 97%)',
              colorText: 'hsl(140 25% 97%)',
              colorTextSecondary: 'hsl(140 8% 62%)',
              colorDanger: 'hsl(0 72% 52%)',
              colorSuccess: 'hsl(142 70% 55%)',
              borderRadius: '1rem',
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
            },
            elements: {
              card: 'bg-transparent shadow-none border-0',
              formButtonPrimary:
                'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow',
              socialButtonsBlockButton:
                'border border-border bg-surface-2 hover:bg-surface-3',
              footerActionLink: 'text-primary hover:text-primary/80',
            },
          }}
        >
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
        </ClerkProvider>
      </body>
    </html>
  );
}
