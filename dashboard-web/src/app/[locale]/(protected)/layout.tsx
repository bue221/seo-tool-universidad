import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';

import { Sidebar } from './_components/Sidebar';
import { Topbar } from './_components/Topbar';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * ProtectedLayout — shell command-center (PR-2 / ui-cc-shell).
 *
 * Estructura:
 *   ┌────────────┬───────────────────────────────────────┐
 *   │            │ Topbar (CommandBar + bell + UserPill) │
 *   │  Sidebar   ├───────────────────────────────────────┤
 *   │ (sticky)   │                                       │
 *   │            │  Main (children)                      │
 *   │            │                                       │
 *   └────────────┴───────────────────────────────────────┘
 *
 * - Sidebar es `sticky h-screen` y se renderiza fuera del max-w para llegar
 *   al borde izquierdo del viewport (look industrial de las refs).
 * - Topbar `sticky top-0 z-30`, encima del scroll del main.
 * - Main scrolla independientemente con `max-w-7xl` interno por contenido.
 *
 * El CommandPalette se monta una vez acá; se abre con ⌘K global o vía el
 * trigger `<CommandBar>` del Topbar (CustomEvent `commandpalette:open`).
 *
 * Auth: `getCurrentUser()` delega a Clerk; si no hay sesión, redirect al login
 * con el locale actual preservado.
 */
export default async function ProtectedLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: '/login', locale: locale as 'es' | 'en' });
    return null;
  }

  const tCommon = await getTranslations('Common');
  const tChrome = await getTranslations('Chrome');
  const tTheme = await getTranslations('Theme');

  // displayName: del perfil en Supabase si está, sino local-part del email.
  // Tier es estático por ahora — cuando exista billing, viene de
  // user.publicMetadata.tier o de la tabla `profiles`.
  const displayName =
    user.displayName?.trim() || user.email.split('@')[0] || 'Usuario';

  const labels = {
    sidebar: {
      sections: {
        command: tChrome('Sidebar.sections.command'),
        insights: tChrome('Sidebar.sections.insights'),
      },
      items: {
        dashboard: tChrome('Sidebar.items.dashboard'),
        audit: tChrome('Sidebar.items.audit'),
        compare: tChrome('Sidebar.items.compare'),
        gsc: tChrome('Sidebar.items.gsc'),
        gbp: tChrome('Sidebar.items.gbp'),
        analytics: tChrome('Sidebar.items.analytics'),
        settings: tChrome('Sidebar.items.settings'),
      },
      collapse: tChrome('Sidebar.collapse'),
      signOut: tChrome('Sidebar.signOut'),
    },
    topbar: {
      commandPlaceholder: tChrome('CommandBar.placeholder'),
      notificationsTitle: tChrome('Notifications.title'),
      notificationsEmpty: tChrome('Notifications.empty'),
      viewSwitcher: tChrome('ViewSwitcher.label'),
    },
    commandPalette: {
      ariaLabel: tChrome('CommandPalette.ariaLabel'),
      description: tChrome('CommandPalette.description'),
      placeholder: tChrome('CommandPalette.placeholder'),
      empty: tChrome('CommandPalette.empty'),
      groups: {
        navigation: tChrome('CommandPalette.groups.navigation'),
        theme: tChrome('CommandPalette.groups.theme'),
        account: tChrome('CommandPalette.groups.account'),
      },
      items: {
        dashboard: tChrome('CommandPalette.items.dashboard'),
        audit: tChrome('CommandPalette.items.audit'),
        gbp: tChrome('CommandPalette.items.gbp'),
        analytics: tChrome('CommandPalette.items.analytics'),
        settings: tChrome('CommandPalette.items.settings'),
        signOut: tChrome('CommandPalette.items.signOut'),
      },
      theme: {
        light: tTheme('light'),
        dark: tTheme('dark'),
        system: tTheme('system'),
      },
    },
  };

  return (
    <div className="relative flex min-h-screen text-foreground">
      <CommandPalette locale={locale} labels={labels.commandPalette} />

      <Sidebar
        brand={tCommon('appName')}
        user={{
          name: displayName,
          email: user.email,
          tier: tChrome('User.tier'),
          locale,
        }}
        labels={labels.sidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          brand={tCommon('appName')}
          user={{ name: displayName, tier: tChrome('User.tier') }}
          labels={labels.topbar}
        />

        <main
          aria-live="polite"
          className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
