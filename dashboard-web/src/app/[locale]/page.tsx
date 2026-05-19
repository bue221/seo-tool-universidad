import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <span className="font-semibold tracking-tight">{tc('appName')}</span>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <Separator orientation="vertical" className="h-6" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12">
        <section className="space-y-5 text-center">
          <h1 className="text-balance text-4xl font-bold sm:text-5xl">{t('title')}</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">{t('subtitle')}</p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild size="lg"><Link href="/audit">{t('ctaPrimary')}</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/dashboard">{t('ctaSecondary')}</Link></Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Feature title={t('feature1Title')} description={t('feature1Desc')} />
          <Feature title={t('feature2Title')} description={t('feature2Desc')} />
          <Feature title={t('feature3Title')} description={t('feature3Desc')} />
          <Feature title={t('feature4Title')} description={t('feature4Desc')} />
        </section>

        <section className="space-y-3 text-center">
          <h2 className="text-2xl font-semibold">{t('howTitle')}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Step text={t('how1')} />
            <Step text={t('how2')} />
            <Step text={t('how3')} />
          </div>
        </section>

        <section className="rounded-xl border p-8 text-center">
          <p className="mb-3 text-xl font-semibold">{t('finalCta')}</p>
          <Button asChild><Link href="/signup">{t('ctaPrimary')}</Link></Button>
        </section>
      </main>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

function Step({ text }: { text: string }) {
  return <div className="rounded-lg border p-4 text-sm">{text}</div>;
}
