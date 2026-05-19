import { Sparkles } from 'lucide-react';

import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { SectionLabel } from '@/components/ui/section-label';

/**
 * Layout para rutas `/login` y `/signup` (ui-cc-pages).
 *
 * Los componentes Clerk (`<SignIn />`, `<SignUp />`) traen su propia card
 * tematizada vía ClerkProvider.appearance (definido en [locale]/layout). Acá
 * solo aportamos chrome:
 *   - Background grid faint con radial mask.
 *   - Brand block con logo gradient + tagline.
 *   - Selectores de locale/theme arriba a la derecha.
 *   - Fade-up on mount.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden p-6">
      {/* Grid faint detrás del card; el body ya aporta el mesh radial. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-faint opacity-70"
      />

      <div className="relative z-10 flex w-full max-w-md items-center justify-between gap-2 animate-in fade-in duration-500">
        <SectionLabel>Acceso seguro</SectionLabel>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow"
        >
          <Sparkles className="size-6" strokeWidth={2.5} />
        </span>
        <p className="font-display text-display-sm">LumoSEO</p>
        <p className="text-sm text-muted-foreground">
          Hacé medible tu visibilidad.
        </p>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 fill-mode-both">
        {children}
      </div>
    </div>
  );
}
