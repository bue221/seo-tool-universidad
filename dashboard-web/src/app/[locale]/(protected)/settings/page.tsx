import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

type Props = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations('Settings'),
  ]);

  const displayName =
    user?.displayName?.trim() || user?.email?.split('@')[0] || '—';
  const email = user?.email ?? '—';

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Perfil */}
        <SectionCard title={t('Profile.title')}>
          <dl className="space-y-4">
            <div>
              <dt className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('Profile.name')}
              </dt>
              <dd className="text-sm text-foreground">{displayName}</dd>
            </div>
            <div>
              <dt className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('Profile.email')}
              </dt>
              <dd className="text-sm text-foreground">{email}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-muted-foreground/70">
            {t('Profile.hint')}
          </p>
        </SectionCard>

        {/* Preferencias */}
        <SectionCard title={t('Preferences.title')}>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                {t('Preferences.language')}
              </span>
              <LocaleSwitcher />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                {t('Preferences.theme')}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
