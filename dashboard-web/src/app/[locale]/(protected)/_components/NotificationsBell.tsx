'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NotificationsBellProps {
  emptyLabel: string;
  titleLabel: string;
}

/**
 * NotificationsBell \u2014 stub de notificaciones.
 *
 * Render: icon button con dot rojo si hay items. Dropdown muestra lista o
 * estado vac\u00edo. Por ahora la lista vive en memoria local (mock) \u2014 cuando
 * exista un endpoint real, reemplazar `useNotifications()` por una query.
 *
 * Decisi\u00f3n: client component porque el dot count + dropdown son estado UI.
 * Si el backend pasa a SSE, mantener el componente client y solo cambiar el
 * source del hook interno.
 */
export function NotificationsBell({
  emptyLabel,
  titleLabel,
}: NotificationsBellProps) {
  // Mock: lista vac\u00eda. Reemplazar por hook real cuando exista.
  const [items] = React.useState<Array<{ id: string; text: string }>>([]);
  const hasItems = items.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={titleLabel}
          className={cn(
            'relative inline-flex size-10 items-center justify-center rounded-full border border-border/60 bg-surface-2/60 text-muted-foreground transition-colors',
            'hover:bg-surface-3 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <Bell className="size-4" aria-hidden />
          {hasItems && (
            <span
              aria-hidden
              className="absolute right-2 top-2 size-2 rounded-full bg-rose-400 ring-2 ring-surface-1"
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{titleLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasItems ? (
          items.map((n) => (
            <DropdownMenuItem key={n.id} className="text-sm">
              {n.text}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">
            {emptyLabel}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
