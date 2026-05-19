import { getTranslations } from 'next-intl/server';
import { AuditForm } from './_components/AuditForm';
import { AuditHistoryList } from './_components/AuditHistoryList';

type Props = { params: Promise<{ locale: 'es' | 'en' }> };

export default async function AuditPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('Audit.History');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SEO Audit Runner</h1>
        <p className="text-sm text-muted-foreground">Run a technical audit and review your latest snapshots.</p>
      </div>
      <AuditForm locale={locale} />
      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <AuditHistoryList />
      </section>
    </div>
  );
}
