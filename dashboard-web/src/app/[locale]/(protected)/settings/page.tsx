import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your workspace profile, preferences and integration defaults."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Profile">
          <p className="text-sm text-muted-foreground">Name, contact and business defaults (coming next).</p>
        </SectionCard>
        <SectionCard title="Preferences">
          <p className="text-sm text-muted-foreground">Locale, theme and reporting preferences (coming next).</p>
        </SectionCard>
      </div>
    </div>
  );
}
