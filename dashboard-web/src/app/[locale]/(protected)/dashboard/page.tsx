import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { listSnapshots } from '@/lib/audit/persistence';
import { KpiCard } from '@/components/app/KpiCard';
import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const snapshots = await listSnapshots(20);
  const avg = snapshots.length
    ? snapshots.reduce((acc, row) => acc + Number(row.global_score), 0) / snapshots.length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.displayName ?? user?.email ?? 'there'}`}
        description="Track your SEO performance, run audits and monitor optimization signals from one workspace."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Snapshots" value={String(snapshots.length)} helper="Latest audits stored" />
        <KpiCard title="Average score" value={avg.toFixed(1)} helper="Global score across recent audits" />
        <KpiCard title="Best score" value={snapshots.length ? Math.max(...snapshots.map((s) => Number(s.global_score))).toFixed(1) : '0.0'} helper="Highest global score" />
        <KpiCard title="Last audit" value={snapshots[0] ? new Date(snapshots[0].fetched_at).toLocaleDateString() : '—'} helper="Most recent execution" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Quick actions">
          <div className="space-y-2 text-sm">
            <ActionLink href="/audit" label="Run new audit" />
            <ActionLink href="/analytics" label="Open analytics dashboard" />
            <ActionLink href="/gbp" label="Manage GBP simulator" />
            <ActionLink href="/settings" label="Review workspace settings" />
          </div>
        </SectionCard>

        <SectionCard title="Recent activity">
          {snapshots.length ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {snapshots.slice(0, 5).map((row) => (
                <li key={row.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="truncate">{row.url}</span>
                  <span className="ml-4 font-medium text-foreground">{Number(row.global_score).toFixed(1)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet. Run your first audit.</p>
          )}
        </SectionCard>
      </section>
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded-md border px-3 py-2 hover:bg-muted">
      {label}
    </Link>
  );
}
