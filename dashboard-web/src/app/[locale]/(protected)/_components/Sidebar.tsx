'use client';

import * as React from 'react';
import {
  BarChart3,
  ChevronsLeft,
  GitCompare,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Search,
  Settings,
  Sparkles,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';

import { Link, usePathname } from '@/i18n/navigation';
import { SectionLabel } from '@/components/ui/section-label';
import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: LucideIcon };

type NavGroup = {
  /** Translation key under `Chrome.Sidebar.sections.<key>` — default fallback shown if missing. */
  labelKey: 'command' | 'insights';
  /** Fallback en español (interno) — solo se muestra si i18n no resolvió. */
  fallback: string;
  items: readonly NavItem[];
};

const NAV_GROUPS: readonly NavGroup[] = [
  {
    labelKey: 'command',
    fallback: 'Comando',
    items: [
      { href: '/dashboard', label: 'Panel Nexus', icon: LayoutDashboard },
      { href: '/audit', label: 'Auditoría SEO', icon: ScanLine },
      { href: '/compare', label: 'Compare', icon: GitCompare },
      { href: '/gsc', label: 'Search Console', icon: Search },
      { href: '/gbp', label: 'GBP', icon: Store },
    ],
  },
  {
    labelKey: 'insights',
    fallback: 'Insights',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  brand: string;
  user: { name: string; email: string; tier: string; locale: string };
  labels: {
    sections: { command: string; insights: string };
    collapse: string;
    signOut: string;
  };
}

/**
 * Sidebar permanente del shell protegido (PR-2 / ui-cc-shell).
 *
 * Estructura visual (refs "command center"):
 *   ┌──────────────────────┐
 *   │ [logo] LumoSEO    ‹  │ ← brand block + toggle collapse
 *   ├──────────────────────┤
 *   │ COMANDO              │ ← SectionLabel
 *   │ • Panel Nexus    ◉   │ ← item activo: ring-active + tint
 *   │ • Auditoría SEO      │
 *   │ ...                  │
 *   ├──────────────────────┤
 *   │ INSIGHTS             │
 *   │ • Analytics          │
 *   ├──────────────────────┤
 *   │ [avatar] Andrés      │ ← footer user
 *   │ ⏻ Cerrar sesión       │
 *   └──────────────────────┘
 *
 * Collapse:
 * - `w-64` expandido → `w-16` colapsado, label + section + footer-text se
 *   ocultan con `opacity-0` + `pointer-events-none` (no `display:none` para
 *   evitar relayout que rompa la animación).
 * - Estado persistido en `localStorage["sidebar.collapsed"]`. Lectura via
 *   useEffect post-mount para no romper SSR (hydration mismatch).
 *
 * Active item:
 * - Aplica `ring-active` (utility de globals.css) + `bg-primary/8` + ícono primary.
 * - `aria-current="page"` en el Link.
 */
export function Sidebar({ brand, user, labels }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem('sidebar.collapsed');
      if (stored === '1') setCollapsed(true);
    } catch {
      /* localStorage bloqueado (private mode) — fallback expanded. */
    }
    setMounted(true);
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem('sidebar.collapsed', next ? '1' : '0');
      } catch {
        /* idem */
      }
      return next;
    });
  }, []);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        // Desktop-only por ahora; el drawer mobile queda como follow-up.
        'group/sidebar sticky top-0 hidden h-screen flex-col border-r border-border-strong bg-surface-1/80 backdrop-blur-xl md:flex',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-16' : 'w-64',
      )}
      aria-label="Sidebar"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border-strong px-4">
        <div
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-base font-bold text-primary-foreground shadow-glow"
        >
          <Sparkles className="size-5" strokeWidth={2.5} />
        </div>
        <span
          className={cn(
            'flex-1 truncate text-base font-semibold tracking-tight transition-opacity duration-200',
            collapsed && 'pointer-events-none opacity-0',
          )}
        >
          {brand}
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-label={labels.collapse}
          aria-pressed={collapsed}
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-surface-3 hover:text-foreground',
            collapsed && 'rotate-180',
          )}
        >
          <ChevronsLeft className="size-4" aria-hidden />
        </button>
      </div>

      {/* Nav groups */}
      <nav
        aria-label="Primary"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-6"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey} className="space-y-1">
            <SectionLabel
              className={cn(
                'block px-2 transition-opacity duration-200',
                collapsed && 'pointer-events-none opacity-0',
              )}
            >
              {labels.sections[group.labelKey]}
            </SectionLabel>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  data-active={isActive}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors',
                    'hover:bg-surface-2 hover:text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    'data-[active=true]:bg-primary/10 data-[active=true]:text-foreground data-[active=true]:ring-active',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4 shrink-0 transition-colors',
                      'group-data-[active=true]:text-primary',
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'flex-1 truncate transition-opacity duration-200',
                      collapsed && 'pointer-events-none opacity-0',
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer user */}
      <div className="border-t border-border-strong p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-2',
            collapsed && 'justify-center',
          )}
        >
          <div
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground"
          >
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          {!collapsed && mounted && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {user.name}
              </p>
              <p className="truncate text-[10px] uppercase tracking-tracked-label text-primary/80">
                {user.tier}
              </p>
            </div>
          )}
        </div>
        <SignOutButton redirectUrl={`/${user.locale}/login`}>
          <button
            type="button"
            className={cn(
              'mt-1 inline-flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-2 hover:text-destructive',
              collapsed && 'justify-center',
            )}
          >
            <LogOut className="size-3.5" aria-hidden />
            <span
              className={cn(
                'transition-opacity duration-200',
                collapsed && 'pointer-events-none hidden opacity-0',
              )}
            >
              {labels.signOut}
            </span>
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
