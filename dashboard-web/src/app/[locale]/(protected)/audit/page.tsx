import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';

import { AuditForm } from './_components/AuditForm';
import { AuditHistoryList } from './_components/AuditHistoryList';

type Props = { params: Promise<{ locale: 'es' | 'en' }> };

export default async function AuditPage({ params }: Props) {
  const { locale } = await params;
  const tPage = await getTranslations('Audit.Page');
  const tHistory = await getTranslations('Audit.History');

  return (
    <div className="space-y-8">
      <PageHeader
        title={tPage('title')}
        accent={tPage('titleAccent')}
        description={tPage('description')}
      />

      <SectionCard
        eyebrow={tPage('deploy.eyebrow')}
        title={tPage('deploy.title')}
        description={tPage('deploy.description')}
      >
        <AuditForm locale={locale} />
      </SectionCard>

      <SectionCard eyebrow={tPage('history.eyebrow')} title={tHistory('title')}>
        <AuditHistoryList />
      </SectionCard>
    </div>
  );
}
