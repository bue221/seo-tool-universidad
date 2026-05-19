import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  ArrowRight,
  BarChart3,
  Gauge,
  Search,
  ScanLine,
  Sparkles,
} from 'lucide-react';

import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradientHeading } from '@/components/ui/gradient-heading';
import { IconBadge } from '@/components/ui/icon-badge';
import { SectionLabel } from '@/components/ui/section-label';
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

/**
 * Landing — "command center" public face (ui-cc-pages).
 *
 * Estructura:
 *   [Header sticky con brand + nav + locale/theme]
 *   ┌─ Hero ─────────────────────────────────────────────┐
 *   │ Eyebrow pill                                       │
 *   │ GradientHeading display ("Hacé medible tu VISIBILIDAD") │
 *   │ Sub                                                │
 *   │ Dual CTA: glow primary + ghost                     │
 *   │ bg-grid-faint underlay                             │
 *   └────────────────────────────────────────────────────┘
 *   [Features 2×2 IconBadge cards]
 *   [How it works 3 steps]
 *   [FAQ 3 cards]
 *   [Final CTA con surface elevated + glow]
 *   [Footer]
 *
 * Mantiene la copy de i18n; reorganiza presentación.
 */
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Landing');
  const tc = await getTranslations('Common');

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      {/* Hero underlay: grid faint + radial mask. Sin .bg-dots para evitar ruido visual. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[90vh] bg-grid-faint opacity-60"
      />

      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground"
            >
              <Sparkles className="size-4" strokeWidth={2.5} />
            </span>
            <span className="font-semibold tracking-tight">{tc('appName')}</span>
          </div>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              {t('nav.features')}
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              {t('nav.how')}
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              {t('nav.faq')}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <Separator orientation="vertical" className="h-6" />
            <ThemeToggle />
            <Button asChild size="sm" variant="ghost">
              <Link href="/login">{t('ctaLogin')}</Link>
            </Button>
            <Button asChild size="sm" variant="default">
              <Link href="/signup">{t('ctaPrimary')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 py-20 md:py-28">
        {/* Hero */}
        <section className="relative space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-2/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <Sparkles className="size-3 text-primary" />
            <SectionLabel>{t('sections.intelligence')}</SectionLabel>
            <span className="opacity-60">·</span>
            <span>{t('trust')}</span>
          </div>

          <GradientHeading
            as="h1"
            size="lg"
            accent={t('titleAccent')}
            className="mx-auto max-w-4xl text-balance animate-in fade-in slide-in-from-bottom-2 duration-700"
          >
            {t('titleLead')}
          </GradientHeading>

          <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 fill-mode-both">
            {t('subtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
            <Button asChild size="pill" variant="glow" className="group">
              <Link href="/signup">
                {t('ctaPrimary')}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link href="/login">{t('ctaSecondary')}</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/60 animate-in fade-in duration-700 delay-300 fill-mode-both">
            {t('trustLine')}
          </p>
        </section>

        {/* Features */}
        <section id="features" className="space-y-8">
          <div className="space-y-2 text-center">
            <SectionLabel>{t('sections.platform')}</SectionLabel>
            <GradientHeading as="h2" size="sm" accent={t('featuresTitleAccent')}>
              {t('featuresTitleLead')}
            </GradientHeading>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feature
              icon={<Gauge />}
              variant="primary"
              title={t('feature1Title')}
              description={t('feature1Desc')}
            />
            <Feature
              icon={<ScanLine />}
              variant="accent"
              title={t('feature2Title')}
              description={t('feature2Desc')}
            />
            <Feature
              icon={<Search />}
              variant="primary"
              title={t('feature3Title')}
              description={t('feature3Desc')}
            />
            <Feature
              icon={<BarChart3 />}
              variant="accent"
              title={t('feature4Title')}
              description={t('feature4Desc')}
            />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="space-y-8">
          <div className="space-y-2 text-center">
            <SectionLabel>{t('sections.process')}</SectionLabel>
            <GradientHeading as="h2" size="sm" accent={t('howTitleAccent')}>
              {t('howTitleLead')}
            </GradientHeading>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Step n={1} text={t('how1')} />
            <Step n={2} text={t('how2')} />
            <Step n={3} text={t('how3')} />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="space-y-8">
          <div className="space-y-2 text-center">
            <SectionLabel>{t('sections.faq')}</SectionLabel>
            <GradientHeading as="h2" size="sm" accent={t('faqTitleAccent')}>
              {t('faqTitleLead')}
            </GradientHeading>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FaqItem q={t('faq1q')} a={t('faq1a')} />
            <FaqItem q={t('faq2q')} a={t('faq2a')} />
            <FaqItem q={t('faq3q')} a={t('faq3a')} />
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface-2/60 p-10 text-center shadow-pop backdrop-blur-sm md:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"
          />
          <div className="relative space-y-6">
            <SectionLabel>{t('sections.cta')}</SectionLabel>
            <GradientHeading as="p" size="sm" accent={t('finalCtaAccent')}>
              {t('finalCtaLead')}
            </GradientHeading>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="pill" variant="glow" className="group">
                <Link href="/signup">
                  {t('ctaPrimary')}
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="pill" variant="ghost">
                <Link href="/login">{t('ctaSecondary')}</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60">{t('trustLine')}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 px-6 py-6 text-center text-xs text-muted-foreground">
        {t('footer')}
      </footer>
    </div>
  );
}

function Feature({
  icon,
  variant,
  title,
  description,
}: {
  icon: React.ReactNode;
  variant: 'primary' | 'accent';
  title: string;
  description: string;
}) {
  return (
    <Card variant="surface" interactive className="group">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <IconBadge variant={variant} size="lg">
          {icon}
        </IconBadge>
        <CardTitle className="text-lg leading-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="group relative rounded-2xl border border-border/60 bg-surface-2/60 p-6 text-left shadow-card backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-border">
      <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary nums-tabular">
        {n.toString().padStart(2, '0')}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <Card variant="surface">
      <CardHeader>
        <CardTitle className="text-base">{q}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{a}</CardContent>
    </Card>
  );
}
