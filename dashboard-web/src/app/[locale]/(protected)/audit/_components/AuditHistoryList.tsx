import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { listSnapshots } from '@/lib/audit/persistence';
import { ScoreBadge } from './ScoreBadge';

export async function AuditHistoryList() {
  const t = await getTranslations('Audit.History');
  const tc = await getTranslations('Audit.Result.Common');
  const snapshots = await listSnapshots(10);

  if (!snapshots.length) {
    return <p className="text-sm text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <div className="space-y-3">
      {snapshots.map((snapshot) => (
        <Card key={snapshot.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{snapshot.url}</p>
              <p className="text-xs text-muted-foreground">{new Date(snapshot.fetched_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <ScoreBadge score={Number(snapshot.global_score)} />
              <Link href={`/audit/${snapshot.id}`} className="text-sm underline">
                {tc('viewDetails')}
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
