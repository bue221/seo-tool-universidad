import { getTranslations } from 'next-intl/server';
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
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">URL</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {snapshots.map((snapshot) => (
            <tr key={snapshot.id} className="border-t">
              <td className="px-4 py-3 font-medium">{snapshot.url}</td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(snapshot.fetched_at).toLocaleString()}</td>
              <td className="px-4 py-3"><ScoreBadge score={Number(snapshot.global_score)} /></td>
              <td className="px-4 py-3">
                <Link href={`/audit/${snapshot.id}`} className="underline">{tc('viewDetails')}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
