import { LogOut } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { signOut } from '@/app/[locale]/(auth)/_actions/sign-out';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export async function UserMenu({ email }: { email: string }) {
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
          <form action={signOut}>
            <button className="flex w-full items-center gap-2" type="submit">
              <LogOut className="h-4 w-4" />
              {t('signOut')}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
