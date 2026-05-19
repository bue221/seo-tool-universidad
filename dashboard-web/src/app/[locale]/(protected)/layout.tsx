import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UserMenu } from './_components/UserMenu';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProtectedLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: '/login', locale: locale as 'es' | 'en' });
  }

  const t = await getTranslations('Common');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-sm font-semibold tracking-tight">{t('appName')}</span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <UserMenu email={user.email} />
        </div>
      </header>
      <nav className="border-b px-6 py-2 text-sm text-muted-foreground">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
          <Link href="/audit" className="hover:text-foreground">Audit</Link>
          <Link href="/gbp" className="hover:text-foreground">GBP</Link>
          <Link href="/analytics" className="hover:text-foreground">Analytics</Link>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-6xl p-6">{children}</main>
    </div>
  );
}
