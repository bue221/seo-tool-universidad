'use server';

import { signInSchema } from './schemas';
import { createClient } from '@/lib/supabase/server';

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid credentials payload' } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: { code: error.code ?? 'AUTH_ERROR', message: error.message } };
  }

  return { ok: true };
}
