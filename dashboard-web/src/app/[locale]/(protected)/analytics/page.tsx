import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listSnapshots } from '@/lib/audit/persistence';

export default async function AnalyticsPage() {
  const snapshots = await listSnapshots(100);

  if (!snapshots.length) {
    return <p className="text-sm text-muted-foreground">No snapshots yet. Run an audit first.</p>;
  }

  const avg = snapshots.reduce((acc, s) => acc + Number(s.global_score), 0) / snapshots.length;

  const best = Math.max(...snapshots.map((s) => Number(s.global_score)));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Quick KPI view from your latest SEO snapshots.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Total snapshots</CardTitle></CardHeader>
          <CardContent>{snapshots.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Average score</CardTitle></CardHeader>
          <CardContent>{avg.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Best score</CardTitle></CardHeader>
          <CardContent>{best.toFixed(2)}</CardContent>
        </Card>
      </div>
    </div>
  );
}
