import { SignOutButton } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Menú del usuario en el header de rutas protegidas.
 * Sign-out via `<SignOutButton>` de Clerk: limpia la sesión en el cliente
 * y redirige a `redirectUrl`. No requiere server action propia.
 */
export async function UserMenu({ email, locale }: { email: string; locale: string }) {
  const t = await getTranslations('Auth.UserMenu');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <SignOutButton redirectUrl={`/${locale}/login`}>
            <button className="flex w-full items-center gap-2" type="button">
              <LogOut className="h-4 w-4" />
              {t('signOut')}
            </button>
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
