'use server';

import { signUpSchema } from './schemas';
import { createClient } from '@/lib/supabase/server';

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  });

  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid signup payload' } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
    },
  });

  if (error) {
    return { ok: false, error: { code: error.code ?? 'AUTH_ERROR', message: error.message } };
  }

  return { ok: true };
}
