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
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ItemKey =
  | 'dashboard'
  | 'audit'
  | 'compare'
  | 'gsc'
  | 'gbp'
  | 'analytics'
  | 'settings';

type NavItem = { href: string; key: ItemKey; icon: LucideIcon };

type NavGroup = {
  labelKey: 'command' | 'insights';
  fallback: string;
  items: readonly NavItem[];
};

const NAV_GROUPS: readonly NavGroup[] = [
  {
    labelKey: 'command',
    fallback: 'Comando',
    items: [
      { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
      { href: '/audit', key: 'audit', icon: ScanLine },
      { href: '/compare', key: 'compare', icon: GitCompare },
      { href: '/gsc', key: 'gsc', icon: Search },
      { href: '/gbp', key: 'gbp', icon: Store },
    ],
  },
  {
    labelKey: 'insights',
    fallback: 'Insights',
    items: [
      { href: '/analytics', key: 'analytics', icon: BarChart3 },
      { href: '/settings', key: 'settings', icon: Settings },
    ],
  },
];

interface SidebarLabels {
  sections: { command: string; insights: string };
  items: Record<ItemKey, string>;
  collapse: string;
  signOut: string;
}

interface SidebarUser {
  name: string;
  email: string;
  tier: string;
  locale: string;
}

interface SidebarProps {
  brand: string;
  user: SidebarUser;
  labels: SidebarLabels;
}

// ---------------------------------------------------------------------------
// Shared nav items (reutilizado en desktop + mobile drawer)
// ---------------------------------------------------------------------------

function SidebarNavItems({
  pathname,
  labels,
  showLabels,
  onItemClick,
}: {
  pathname: string;
  labels: SidebarLabels;
  showLabels: boolean;
  onItemClick?: () => void;
}) {
  return (
    <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey} className="space-y-1">
          <SectionLabel
            className={cn(
              'block px-2 transition-opacity duration-200',
              !showLabels && 'pointer-events-none opacity-0',
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
                onClick={onItemClick}
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
                    !showLabels && 'pointer-events-none opacity-0',
                  )}
                >
                  {labels.items[item.key]}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main Sidebar
// ---------------------------------------------------------------------------

/**
 * Sidebar del shell protegido.
 *
 * Desktop:
 *   - Un `div` espaciador (sticky, w-16/w-64) mantiene el espacio en el layout.
 *   - El `<aside>` es `fixed left-0 top-0` para poder flotar sobre el contenido
 *     al hacer hover cuando está colapsado, sin causar layout shift.
 *   - Cuando el usuario hace hover sobre el icon-rail colapsado, el aside se
 *     expande a w-64 con z-40 + shadow-2xl (overlay mode).
 *   - El toggle de colapso "pinca" el estado en localStorage.
 *
 * Mobile:
 *   - El aside desktop está hidden en <md.
 *   - Un Sheet (Radix Dialog) se abre al recibir el CustomEvent `sidebar:open`
 *     que dispara el botón hamburguesa del Topbar.
 */
export function Sidebar({ brand, user, labels }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const leaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem('sidebar.collapsed');
      if (stored === '1') setCollapsed(true);
    } catch {
      /* localStorage bloqueado — fallback expanded */
    }
    setMounted(true);
  }, []);

  // Escuchar evento del botón hamburguesa del Topbar
  React.useEffect(() => {
    function onOpen() {
      setMobileOpen(true);
    }
    window.addEventListener('sidebar:open', onOpen);
    return () => window.removeEventListener('sidebar:open', onOpen);
  }, []);

  // Cleanup del debounce timer
  React.useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
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
    // Limpiar hover al pinear
    setIsHovered(false);
  }, []);

  const handleMouseEnter = React.useCallback(() => {
    if (!collapsed) return;
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setIsHovered(true);
  }, [collapsed]);

  const handleMouseLeave = React.useCallback(() => {
    // Gracia de 200 ms para evitar colapso al pasar brevemente el cursor
    leaveTimerRef.current = setTimeout(() => setIsHovered(false), 200);
  }, []);

  // Estado visual: expandido si no está colapsado O si está en hover
  const isExpanded = !collapsed || isHovered;

  return (
    <>
      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="flex w-72 flex-col p-0 border-r border-border-strong bg-surface-1"
        >
          <SheetTitle className="sr-only">{brand}</SheetTitle>

          {/* Brand header */}
          <div className="flex h-16 items-center gap-3 border-b border-border-strong px-4">
            <div
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-base font-bold text-primary-foreground shadow-glow"
            >
              <Sparkles className="size-5" strokeWidth={2.5} />
            </div>
            <span className="flex-1 truncate text-base font-semibold tracking-tight">
              {brand}
            </span>
          </div>

          <SidebarNavItems
            pathname={pathname}
            labels={labels}
            showLabels
            onItemClick={() => setMobileOpen(false)}
          />

          {/* Footer mobile */}
          <div className="border-t border-border-strong p-3">
            <div className="flex items-center gap-3 rounded-lg p-2">
              <div
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground"
              >
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-[10px] uppercase tracking-tracked-label text-primary/80">
                  {user.tier}
                </p>
              </div>
            </div>
            <SignOutButton redirectUrl={`/${user.locale}/login`}>
              <button
                type="button"
                className="mt-1 inline-flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-2 hover:text-destructive"
              >
                <LogOut className="size-3.5" aria-hidden />
                <span>{labels.signOut}</span>
              </button>
            </SignOutButton>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop: espaciador en el layout ──────────────────────────── */}
      {/* Mantiene el espacio en flex layout; el aside es fixed (fuera del flujo). */}
      <div
        aria-hidden
        className={cn(
          'sticky top-0 hidden h-screen flex-shrink-0 md:block',
          'transition-[width] duration-200 ease-out',
          collapsed ? 'w-16' : 'w-64',
        )}
      />

      {/* ── Desktop: aside fixed (overlay al hover) ───────────────────── */}
      <aside
        data-collapsed={collapsed}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'group/sidebar fixed left-0 top-0 hidden h-screen flex-col border-r border-border-strong bg-surface-1/80 backdrop-blur-xl md:flex',
          'transition-[width] duration-200 ease-out',
          isExpanded ? 'w-64' : 'w-16',
          // Elevar y sombra cuando flota sobre el contenido al hover
          collapsed && isHovered ? 'z-40 shadow-2xl' : 'z-30',
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
              !isExpanded && 'pointer-events-none opacity-0',
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

        <SidebarNavItems
          pathname={pathname}
          labels={labels}
          showLabels={isExpanded}
        />

        {/* Footer user */}
        <div className="border-t border-border-strong p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg p-2',
              !isExpanded && 'justify-center',
            )}
          >
            <div
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground"
            >
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            {isExpanded && mounted && (
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
                !isExpanded && 'justify-center',
              )}
            >
              <LogOut className="size-3.5" aria-hidden />
              <span
                className={cn(
                  'transition-opacity duration-200',
                  !isExpanded && 'pointer-events-none hidden opacity-0',
                )}
              >
                {labels.signOut}
              </span>
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
}
