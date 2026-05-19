'use client';

import { LayoutDashboard, ScanLine, Search, Store, BarChart3, GitCompare, Settings, type LucideIcon } from 'lucide-react';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/audit',     label: 'Audit',     icon: ScanLine },
  { href: '/compare',   label: 'Compare',   icon: GitCompare },
  { href: '/gsc',       label: 'Search Console', icon: Search },
  { href: '/gbp',       label: 'GBP',       icon: Store },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings',  label: 'Settings',  icon: Settings },
];

/**
 * Sidebar del shell protegido.
 *
 * Client component porque necesita `usePathname()` para resolver el item activo
 * sin lecturas de headers inestables.
 *
 * Active indicator:
 *   - tint de fondo `bg-accent/20`
 *   - barra acentuada izquierda (opacity transition 200ms)
 *   - icono cambia a `text-primary`
 *
 * Sin sliding pill real (eso requerir\u00eda framer-motion `layoutId` o medici\u00f3n de DOM).
 */
export function Sidebar() {
  // `usePathname` de @/i18n/navigation devuelve la ruta SIN el prefijo de locale.
  const pathname = usePathname();

  return (
    <aside className="h-fit overflow-x-auto rounded-xl border border-border/60 bg-card/60 p-2 shadow-soft backdrop-blur-sm">
      <nav aria-label="Primary" className="space-y-0.5 text-sm">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive}
              className="group relative flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground
                         transition-all duration-200
                         hover:bg-accent/15 hover:text-foreground
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                         data-[active=true]:bg-accent/20 data-[active=true]:text-foreground data-[active=true]:shadow-soft"
            >
              <span
                aria-hidden
                className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary
                           opacity-0 transition-opacity duration-200
                           group-data-[active=true]:opacity-100"
              />
              <Icon className="h-4 w-4 shrink-0 transition-colors group-data-[active=true]:text-primary" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
