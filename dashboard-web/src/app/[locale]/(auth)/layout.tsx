import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/**
 * Layout para rutas `/login` y `/signup`.
 *
 * Los componentes Clerk (`<SignIn />`, `<SignUp />`) traen su propia card,
 * acá solo aportamos:
 *   - Background con `.bg-mesh` reforzado + `.bg-dots` para textura.
 *   - Branding minimal.
 *   - Selectores de locale/theme.
 *   - Fade-up on mount (sensación de carga "intencional").
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden p-6">
      {/* Capa de textura: dots sobre el mesh global del body. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots opacity-60" />

      {/* Glow ambiental extra (radial mesh adicional sobre la base). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-mesh" />

      <div className="relative z-10 flex w-full max-w-md justify-end gap-2 animate-in fade-in duration-500">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative z-10 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
        <p className="text-display text-2xl font-semibold tracking-tight">LumoSEO</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Make your visibility measurable.
        </p>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 fill-mode-both">
        {children}
      </div>
    </div>
  );
}
