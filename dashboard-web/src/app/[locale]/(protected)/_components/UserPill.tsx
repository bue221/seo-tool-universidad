import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * UserPill — bloque compacto del usuario en el Topbar.
 *
 *   ┌──────────────────────────────┐
 *   │  ANDRÉS         ┌─────┐      │
 *   │  NIVEL EMPRES.  │  A  │•     │  ← dot status emerald
 *   │                 └─────┘      │
 *   └──────────────────────────────┘
 *
 * - `name`: nombre visible (uppercase aplicado por CSS).
 * - `tier`: label de plan/rol (renderizado vía Badge variant="tier").
 * - `initial`: letra mostrada en el avatar (default: primera letra del nombre).
 * - `online`: si true, muestra dot emerald de status; default true.
 *
 * Server Component puro \u2014 todo el branding viene del padre (que sí lee Clerk).
 */
interface UserPillProps {
  name: string;
  tier: string;
  initial?: string;
  online?: boolean;
}

export function UserPill({
  name,
  tier,
  initial,
  online = true,
}: UserPillProps) {
  const avatarChar = (initial ?? name.slice(0, 1)).toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-full border border-border/60 bg-surface-2/60 py-1 pl-3 pr-1 backdrop-blur">
      <div className="hidden flex-col items-end leading-tight sm:flex">
        <span className="text-[11px] font-semibold uppercase tracking-tight text-foreground">
          {name}
        </span>
        <Badge variant="tier" className="px-1.5 py-0">
          {tier}
        </Badge>
      </div>
      <div className="relative">
        <div
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground"
        >
          {avatarChar}
        </div>
        {online && (
          <span
            aria-label="online"
            className={cn(
              'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400',
              'ring-2 ring-surface-1',
            )}
          />
        )}
      </div>
    </div>
  );
}
