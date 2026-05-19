'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export async function deletePost(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return { ok: false, error: { code: 'VALIDATION_ERROR' } };
  const supabase = await createClient();
  const { error } = await supabase.from('business_posts').delete().eq('id', id.data);
  if (error) return { ok: false, error: { code: 'DB_ERROR' } };
  revalidatePath('/gbp/posts');
  return { ok: true };
}
