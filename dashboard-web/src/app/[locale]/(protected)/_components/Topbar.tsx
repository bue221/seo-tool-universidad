'use client';

import * as React from 'react';
import { LayoutGrid, Menu } from 'lucide-react';

import { CommandBar } from '@/components/ui/command-bar';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

import { NotificationsBell } from './NotificationsBell';
import { UserPill } from './UserPill';

interface TopbarProps {
  /** Brand a mostrar en md- (cuando el Sidebar está oculto en mobile drawer). */
  brand: string;
  user: { name: string; tier: string };
  labels: {
    commandPlaceholder: string;
    notificationsTitle: string;
    notificationsEmpty: string;
    viewSwitcher: string;
  };
}

/**
 * Topbar del shell protegido (PR-2 / ui-cc-shell).
 *
 * Layout:
 *   [brand-md-hidden]  [CommandBar centered]  [Theme] [Locale] [Bell] [Grid] [UserPill]
 *
 * - CommandBar es un trigger que dispara el CommandPalette via CustomEvent
 *   `commandpalette:open` (el palette mismo lo escucha — ver CommandPalette.tsx).
 *   Mantiene la separación: Topbar no conoce el estado interno del palette.
 * - ThemeToggle + LocaleSwitcher se conservan del header anterior para no
 *   perder funcionalidad, pero quedan a la derecha del bell, fuera del foco
 *   principal.
 * - Grid switcher es un placeholder visual (refs lo muestran) — abrirá un
 *   selector de vistas (dashboard / focus mode) cuando exista la feature.
 *
 * `sticky top-0 z-30` por encima del Sidebar (z-20). border-b strong + blur.
 */
export function Topbar({ brand, user, labels }: TopbarProps) {
  const openPalette = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('commandpalette:open'));
  }, []);

  const openMobileDrawer = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('sidebar:open'));
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-strong bg-surface-1/70 px-4 backdrop-blur-xl md:px-6',
      )}
    >
      {/* Hamburguesa — solo visible en mobile */}
      <button
        type="button"
        aria-label="Abrir navegación"
        onClick={openMobileDrawer}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors md:hidden',
          'hover:bg-surface-2 hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <span className="text-sm font-semibold tracking-tight md:hidden">
        {brand}
      </span>

      <div className="mx-auto flex w-full max-w-2xl flex-1 justify-center">
        <CommandBar
          placeholder={labels.commandPlaceholder}
          kbd="⌘K"
          onOpen={openPalette}
        />
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LocaleSwitcher />
        <NotificationsBell
          titleLabel={labels.notificationsTitle}
          emptyLabel={labels.notificationsEmpty}
        />
        <button
          type="button"
          aria-label={labels.viewSwitcher}
          className={cn(
            'hidden size-10 items-center justify-center rounded-full border border-border/60 bg-surface-2/60 text-muted-foreground transition-colors sm:inline-flex',
            'hover:bg-surface-3 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <LayoutGrid className="size-4" aria-hidden />
        </button>
        <UserPill name={user.name} tier={user.tier} />
      </div>
    </header>
  );
}
