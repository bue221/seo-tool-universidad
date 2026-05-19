import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Sidebar } from './_components/Sidebar';
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
    <div className="relative min-h-screen text-foreground">
      {/* Cmd+K palette \u2014 montado una sola vez para toda la zona protegida. */}
      <CommandPalette locale={locale} />

      {/* Header flotante: blur fuerte + border casi invisible sobre el mesh del body. */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-tight">{t('appName')}</span>
            {/* Hint del shortcut \u2014 mostramos \u2318 para ambos OS, es el patr\u00f3n m\u00e1s reconocible. */}
            <kbd className="hidden items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-flex">
              <span>⌘</span><span>K</span>
            </kbd>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <UserMenu email={user.email} locale={locale} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Sidebar />

        {/* Main con on-mount fade-up (CSS via tailwindcss-animate). */}
        <main
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6"
          aria-live="polite"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
