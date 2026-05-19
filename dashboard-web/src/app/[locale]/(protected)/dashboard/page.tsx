import {
  Activity,
  ArrowUpRight,
  ChartBar,
  Crosshair,
  ScanLine,
  Target,
  Timer,
  Trophy,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { listSnapshots } from '@/lib/audit/persistence';
import { KpiCard } from '@/components/app/KpiCard';
import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';

/**
 * Dashboard — "Comando Nexus" (ui-cc-pages).
 *
 * Layout:
 * - PageHeader con accent gradient ("Comando NEXUS") + actions (Desplegar Auditoría).
 * - KPI grid 4 columnas con iconos + trends mock (los trends reales requieren
 *   historial — por ahora son derivados simples).
 * - Quick actions + Recent activity en dos columnas inferiores.
 *
 * Datos: `listSnapshots(20)` ya existente. No se altera el contrato.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  const snapshots = await listSnapshots(20);
  const avg = snapshots.length
    ? snapshots.reduce((acc, row) => acc + Number(row.global_score), 0) /
      snapshots.length
    : 0;
  const best = snapshots.length
    ? Math.max(...snapshots.map((s) => Number(s.global_score)))
    : 0;
  const lastDate = snapshots[0]
    ? new Date(snapshots[0].fetched_at).toLocaleDateString()
    : '—';

  const greeting = user?.displayName ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Comando"
        accent="Nexus"
        description={`Hola ${greeting}. Matriz avanzada de SEO y señales de visibilidad en un solo lugar.`}
        actions={
          <Button asChild variant="glow" size="pill">
            <Link href="/audit">
              <Target className="size-4" />
              Desplegar auditoría
            </Link>
          </Button>
        }
      />

      {/* KPI grid — primera fila: resumen de auditorías */}
      <section
        aria-label="Indicadores principales"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          icon={<ScanLine />}
          iconVariant="primary"
          title="Snapshots"
          value={String(snapshots.length)}
          helper="Auditorías almacenadas"
        />
        <KpiCard
          icon={<ChartBar />}
          iconVariant="accent"
          title="Score promedio"
          value={avg.toFixed(1)}
          helper="Global score reciente"
        />
        <KpiCard
          icon={<Trophy />}
          iconVariant="success"
          title="Mejor score"
          value={best.toFixed(1)}
          helper="Pico global histórico"
        />
        <KpiCard
          icon={<Timer />}
          iconVariant="neutral"
          title="Última auditoría"
          value={lastDate}
          helper="Ejecución más reciente"
        />
      </section>

      {/* Acciones rápidas + actividad reciente */}
      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          eyebrow="Acciones rápidas"
          title="Workspace"
          description="Atajos a los flujos más usados."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <ActionLink href="/audit" icon={<ScanLine className="size-4" />} label="Nueva auditoría" />
            <ActionLink href="/analytics" icon={<Activity className="size-4" />} label="Analytics" />
            <ActionLink href="/gbp" icon={<Crosshair className="size-4" />} label="GBP Simulator" />
            <ActionLink href="/settings" icon={<Target className="size-4" />} label="Ajustes" />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Actividad reciente"
          title="Últimas auditorías"
          description="Los 5 snapshots más recientes."
        >
          {snapshots.length ? (
            <ul className="space-y-2 text-sm">
              {snapshots.slice(0, 5).map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface-1/40 px-3 py-2 transition-colors hover:bg-surface-3/60"
                >
                  <span className="truncate text-muted-foreground">{row.url}</span>
                  <span className="ml-4 font-semibold text-foreground nums-tabular">
                    {Number(row.global_score).toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no hay actividad. Corré tu primera auditoría.
            </p>
          )}
        </SectionCard>
      </section>
    </div>
  );
}

function ActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface-1/40 px-3 py-2.5 text-sm text-muted-foreground transition-all hover:border-border hover:bg-surface-3/60 hover:text-foreground"
    >
      <span className="flex items-center gap-2.5">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
