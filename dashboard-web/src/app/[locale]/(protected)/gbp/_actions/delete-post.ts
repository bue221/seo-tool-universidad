'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export async function deletePost(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  const { error } = await supabase.from('business_posts').delete().eq('id', id.data);
  if (error) return;
  revalidatePath('/gbp/posts');
}
