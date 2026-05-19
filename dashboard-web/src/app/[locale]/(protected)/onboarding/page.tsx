import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';
import { Link } from '@/i18n/navigation';

export default async function OnboardingPage() {
  const t = await getTranslations('Onboarding');

  const steps = [
    { title: t('steps.setup'), href: '/settings' as const },
    { title: t('steps.audit'), href: '/audit' as const },
    { title: t('steps.analytics'), href: '/analytics' as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <SectionCard title={t('checklistTitle')}>
        <ol className="space-y-2 text-sm">
          {steps.map((step, idx) => (
            <li key={step.title} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>{idx + 1}. {step.title}</span>
              <Link href={step.href} className="underline">{t('open')}</Link>
            </li>
          ))}
        </ol>
      </SectionCard>
    </div>
  );
}
