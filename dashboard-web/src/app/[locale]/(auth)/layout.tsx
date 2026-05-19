import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Card } from '@/components/ui/card';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-end gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
        <Card className="p-6">
          <div className="mb-4 text-center">
            <p className="text-sm font-semibold tracking-tight">LumoSEO</p>
            <p className="text-xs text-muted-foreground">Make your visibility measurable.</p>
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
}
