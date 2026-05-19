import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/metadata';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const t = await getTranslations({ locale: validLocale, namespace: 'Landing' });

  return buildMetadata({
    locale: validLocale,
    path: '/',
    title: 'LumoSEO',
    description: t('subtitle'),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Landing');
  const tc = await getTranslations('Common');

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      {/* Capa de textura para hero \u2014 dots sutiles sobre el mesh del body. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[80vh] bg-dots opacity-50" />

      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/70 px-6 py-3 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <span className="font-semibold tracking-tight">{tc('appName')}</span>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <Separator orientation="vertical" className="h-6" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-16">
        {/* Hero \u2014 display font + on-mount fade-up + CTA con glow. */}
        <section className="space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground shadow-soft backdrop-blur-sm animate-in fade-in duration-500">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>{t('trust')}</span>
          </div>

          <h1 className="text-display text-balance text-5xl font-semibold sm:text-6xl md:text-7xl animate-in fade-in slide-in-from-bottom-2 duration-700">
            {t('title')}
          </h1>

          <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 fill-mode-both">
            {t('subtitle')}
          </p>

          <div className="flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
            <Button asChild size="lg" className="group">
              <Link href="/audit">
                {t('ctaPrimary')}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">{t('ctaSecondary')}</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="grid gap-4 sm:grid-cols-2">
          <Feature title={t('feature1Title')} description={t('feature1Desc')} />
          <Feature title={t('feature2Title')} description={t('feature2Desc')} />
          <Feature title={t('feature3Title')} description={t('feature3Desc')} />
          <Feature title={t('feature4Title')} description={t('feature4Desc')} />
        </section>

        <section id="how" className="space-y-6 text-center">
          <h2 className="text-display text-3xl font-semibold sm:text-4xl">{t('howTitle')}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Step n={1} text={t('how1')} />
            <Step n={2} text={t('how2')} />
            <Step n={3} text={t('how3')} />
          </div>
        </section>

        <section id="faq" className="space-y-6">
          <h2 className="text-display text-center text-3xl font-semibold sm:text-4xl">
            {t('faqTitle')}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <FaqItem q={t('faq1q')} a={t('faq1a')} />
            <FaqItem q={t('faq2q')} a={t('faq2a')} />
            <FaqItem q={t('faq3q')} a={t('faq3a')} />
          </div>
        </section>

        {/* Final CTA con glow ring + gradient. */}
        <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-10 text-center shadow-card backdrop-blur-sm">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-mesh opacity-80" />
          <div className="relative space-y-4">
            <p className="text-display text-2xl font-semibold sm:text-3xl">{t('finalCta')}</p>
            <Button asChild size="lg" className="group">
              <Link href="/signup">
                {t('ctaPrimary')}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 px-6 py-6 text-center text-xs text-muted-foreground">
        {t('footer')}
      </footer>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <Card interactive>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="group relative rounded-xl border border-border/60 bg-card/60 p-5 text-left shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-card">
      <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {n}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{q}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{a}</CardContent>
    </Card>
  );
}
