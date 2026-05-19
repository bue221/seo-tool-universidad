import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';

import { AuditForm } from './_components/AuditForm';
import { AuditHistoryList } from './_components/AuditHistoryList';

type Props = { params: Promise<{ locale: 'es' | 'en' }> };

export default async function AuditPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('Audit.History');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Auditoría"
        accent="SEO"
        description="Corré una auditoría técnica completa y revisá tus snapshots más recientes."
      />

      <SectionCard
        eyebrow="Nuevo análisis"
        title="Desplegar auditoría"
        description="Pegá una URL y ejecutamos PageSpeed + scraper en paralelo."
      >
        <AuditForm locale={locale} />
      </SectionCard>

      <SectionCard eyebrow="Histórico" title={t('title')}>
        <AuditHistoryList />
      </SectionCard>
    </div>
  );
}
