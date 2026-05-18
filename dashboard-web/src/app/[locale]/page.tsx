import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { routing, type Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/metadata';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const t = await getTranslations({ locale: validLocale, namespace: 'HomePage' });
  const tc = await getTranslations({ locale: validLocale, namespace: 'Common' });

  return buildMetadata({
    locale: validLocale,
    path: '/',
    title: t('title'),
    description: tc('tagline'),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('HomePage');
  const tc = await getTranslations('Common');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-sm font-semibold tracking-tight">
          {tc('appName')}
        </span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Separator orientation="vertical" className="h-6" />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="max-w-3xl text-balance text-5xl font-bold tracking-tight">
          {t('title')}
        </h1>

        <p className="max-w-xl text-balance text-muted-foreground">
          {t.rich('intro', {
            code: (chunks) => (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                {chunks}
              </code>
            ),
          })}
        </p>

        <p className="max-w-xl text-sm text-muted-foreground">{tc('tagline')}</p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg">{t('ctaAudit')}</Button>
          <Button size="lg" variant="outline">
            {t('ctaDocs')}
          </Button>
        </div>

        <Card className="mt-8 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">web-foundation · ui-foundation</CardTitle>
            <CardDescription>
              i18n · theme · SEO · Shadcn primitives activos
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
            <DemoStat label="locale" value={locale} />
            <DemoStat label="default" value={routing.defaultLocale} />
            <DemoStat label="prefix" value={String(routing.localePrefix ?? 'as-needed')} />
            <DemoStat label="locales" value={routing.locales.join(', ')} />
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
        web-foundation · ui-foundation · next steps: auth-foundation → audit-runner
      </footer>
    </div>
  );
}

function DemoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-foreground">{value}</span>
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
    </div>
  );
}
