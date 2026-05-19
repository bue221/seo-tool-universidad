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

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/audit', label: 'Audit' },
  { href: '/gbp', label: 'GBP' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
];

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
      <header className="sticky top-0 z-20 border-b bg-background/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">{t('appName')}</span>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <UserMenu email={user.email} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-xl border bg-muted/20 p-3">
          <nav className="space-y-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
