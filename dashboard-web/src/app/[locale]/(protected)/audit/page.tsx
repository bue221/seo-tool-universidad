import { getTranslations } from 'next-intl/server';
import { AuditForm } from './_components/AuditForm';
import { AuditHistoryList } from './_components/AuditHistoryList';

type Props = { params: Promise<{ locale: 'es' | 'en' }> };

export default async function AuditPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('Audit.History');

  return (
    <div className="space-y-6">
      <AuditForm locale={locale} />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <AuditHistoryList />
      </section>
    </div>
  );
}
