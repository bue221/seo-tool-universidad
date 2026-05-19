import { createClient } from '@/lib/supabase/server';

type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    displayName: profile?.display_name ?? null,
  };
}
