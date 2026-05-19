import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
};

/**
 * Resuelve el usuario actual combinando identidad Clerk (auth + email)
 * con el `profiles.display_name` persistido en Supabase.
 *
 * `id` es el Clerk user id (`user_xxx`, no UUID). La tabla `profiles` debe
 * usar `user_id text` para alinearse — ver `design.md` § Migration notes.
 *
 * Retorna `null` si no hay sesión Clerk activa o si el JWT no incluye email.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    id: userId,
    email,
    displayName: profile?.display_name ?? null,
  };
}
