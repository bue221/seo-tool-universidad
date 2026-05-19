'use client';

import * as React from 'react';
import { Command as CommandIcon, Search } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * CommandBar — trigger inline del CommandPalette global.
 *
 * Render visual (no es un input real; al click/foco abre el palette modal):
 *
 *   [ ⌘  Analizar URL, Dominio o Propiedad Digital…            ENTER ]
 *
 * Por qué no es un `<input>`:
 * - El palette ya tiene su propio input con autocomplete/cmdk. Duplicar input
 *   acá fragmenta el foco y el estado (qué query gana).
 * - Este componente es un *trigger*: button con apariencia de search bar.
 *
 * Props:
 * - `placeholder`: texto sugerido (mostrado como gris medio).
 * - `kbd`: label del key hint (default `ENTER`; en otros contextos puede ser `⌘K`).
 * - `onOpen`: callback que dispara el palette. Tipico: `() => setOpen(true)`.
 *
 * A11y:
 * - `role="combobox"` + `aria-expanded={false}` + `aria-haspopup="dialog"`.
 * - El hotkey global (`⌘K`) lo maneja el CommandPalette; este componente solo
 *   expone un trigger clickeable/teclable.
 */
interface CommandBarProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  placeholder?: string;
  kbd?: string;
  onOpen?: () => void;
}

export const CommandBar = React.forwardRef<HTMLButtonElement, CommandBarProps>(
  ({ placeholder = 'Buscar…', kbd = 'ENTER', onOpen, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-expanded={false}
        aria-haspopup="dialog"
        onClick={onOpen}
        className={cn(
          'group inline-flex h-12 w-full max-w-2xl items-center gap-3 rounded-full border border-border/60 bg-surface-1/60 px-4 text-sm backdrop-blur',
          'transition-colors duration-200 hover:border-border hover:bg-surface-1',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className,
        )}
        {...props}
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-surface-3 text-muted-foreground">
          <CommandIcon className="size-3.5" aria-hidden="true" />
        </span>
        <span className="flex-1 truncate text-left text-muted-foreground">
          {placeholder}
        </span>
        <kbd className="hidden items-center gap-1 rounded-md border border-border/60 bg-surface-3 px-2 py-1 text-[10px] font-medium uppercase tracking-tracked-label text-muted-foreground sm:inline-flex">
          {kbd}
        </kbd>
      </button>
    );
  },
);

CommandBar.displayName = 'CommandBar';
