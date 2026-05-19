'use server';

import { updatePasswordSchema } from './schemas';
import { createClient } from '@/lib/supabase/server';

export async function updatePassword(formData: FormData) {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid password payload' } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: { code: error.code ?? 'AUTH_ERROR', message: error.message } };
  }

  return { ok: true };
}
