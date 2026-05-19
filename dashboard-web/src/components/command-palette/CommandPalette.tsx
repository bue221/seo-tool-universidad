'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTheme } from 'next-themes';
import { LayoutDashboard, ScanLine, Store, BarChart3, Settings, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useClerk } from '@clerk/nextjs';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

type PaletteItemKey = 'dashboard' | 'audit' | 'gbp' | 'analytics' | 'settings';

export type CommandPaletteLabels = {
  ariaLabel: string;
  description: string;
  placeholder: string;
  empty: string;
  groups: { navigation: string; theme: string; account: string };
  items: Record<PaletteItemKey | 'signOut', string>;
  theme: { light: string; dark: string; system: string };
};

type Props = {
  locale: string;
  labels: CommandPaletteLabels;
};

const NAV_ITEMS: ReadonlyArray<{ href: string; key: PaletteItemKey; icon: typeof LayoutDashboard }> = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/audit',     key: 'audit',     icon: ScanLine },
  { href: '/gbp',       key: 'gbp',       icon: Store },
  { href: '/analytics', key: 'analytics', icon: BarChart3 },
  { href: '/settings',  key: 'settings',  icon: Settings },
];

/**
 * Command palette global (Cmd+K / Ctrl+K).
 *
 * - Montado en `(protected)/layout.tsx` \u2014 no expuesto en p\u00fablicas.
 * - Item kinds:
 *     a) Navegaci\u00f3n \u2192 router.push.
 *     b) Theme toggle \u2192 next-themes.
 *     c) Sign out \u2192 Clerk signOut().
 *
 * Atajo: Cmd+K en Mac, Ctrl+K en otros. Detectado con `event.metaKey || ctrlKey`
 * para no asumir plataforma (`navigator.platform` no es confiable post-2022).
 */
export function CommandPalette({ locale, labels }: Props) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { signOut } = useClerk();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /*
   * Trigger inline desde `<CommandBar>` (Topbar) u otros consumidores externos.
   * Usamos un CustomEvent en vez de Context para mantener la API plana: el
   * palette ya es un singleton montado en el layout protegido y no necesita
   * conocer a sus triggers.
   */
  React.useEffect(() => {
    const open = () => setOpen(true);
    window.addEventListener('commandpalette:open', open);
    return () => window.removeEventListener('commandpalette:open', open);
  }, []);

  // Helper: ejecutar acci\u00f3n y cerrar palette en el mismo tick.
  const run = React.useCallback((fn: () => void) => {
    setOpen(false);
    // Defer micro-task para que el Dialog cierre antes de navegar/togglear.
    queueMicrotask(fn);
  }, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-background/40 backdrop-blur-sm
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        />
        <DialogPrimitive.Content
          aria-label={labels.ariaLabel}
          className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2
                     overflow-hidden rounded-xl border border-border/60 bg-popover/95
                     shadow-pop backdrop-blur-xl
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
                     data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95
                     data-[state=open]:slide-in-from-top-2 duration-200"
        >
          {/* Title required por Radix Dialog para accesibilidad; lo escondemos visualmente. */}
          <DialogPrimitive.Title className="sr-only">{labels.ariaLabel}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {labels.description}
          </DialogPrimitive.Description>

          <Command>
            <CommandInput placeholder={labels.placeholder} />
            <CommandList>
              <CommandEmpty>{labels.empty}</CommandEmpty>

              <CommandGroup heading={labels.groups.navigation}>
                {NAV_ITEMS.map((item) => (
                  <CommandItem
                    key={item.href}
                    onSelect={() => run(() => router.push(`/${locale}${item.href}`))}
                  >
                    <item.icon />
                    <span>{labels.items[item.key]}</span>
                    <CommandShortcut>{`/${item.href.slice(1)}`}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading={labels.groups.theme}>
                <CommandItem onSelect={() => run(() => setTheme('light'))}>
                  <Sun />
                  <span>{labels.theme.light}</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => setTheme('dark'))}>
                  <Moon />
                  <span>{labels.theme.dark}</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => setTheme('system'))}>
                  <Monitor />
                  <span>{labels.theme.system}</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading={labels.groups.account}>
                <CommandItem
                  onSelect={() => run(() => signOut({ redirectUrl: `/${locale}/login` }))}
                >
                  <LogOut />
                  <span>{labels.items.signOut}</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
