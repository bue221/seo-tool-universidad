'use server';

import { forgotPasswordSchema } from './schemas';
import { createClient } from '@/lib/supabase/server';

export async function requestPasswordReset(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid email payload' } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);

  if (error) {
    return { ok: false, error: { code: error.code ?? 'AUTH_ERROR', message: error.message } };
  }

  return { ok: true };
}
