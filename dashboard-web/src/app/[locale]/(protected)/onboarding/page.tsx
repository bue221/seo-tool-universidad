import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';
import { Link } from '@/i18n/navigation';

const steps = [
  { title: 'Set workspace profile', href: '/settings' },
  { title: 'Run your first audit', href: '/audit' },
  { title: 'Review trends in analytics', href: '/analytics' },
];

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome to LumoSEO"
        description="Complete this quick onboarding to unlock the full workflow."
      />

      <SectionCard title="Onboarding checklist">
        <ol className="space-y-2 text-sm">
          {steps.map((step, idx) => (
            <li key={step.title} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>{idx + 1}. {step.title}</span>
              <Link href={step.href} className="underline">Open</Link>
            </li>
          ))}
        </ol>
      </SectionCard>
    </div>
  );
}
