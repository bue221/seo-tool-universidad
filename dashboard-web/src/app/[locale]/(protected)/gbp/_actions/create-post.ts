'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({ profile_id: z.string().uuid(), title: z.string().min(2), body: z.string().min(2), cta_label: z.string().optional(), cta_url: z.string().url().optional().or(z.literal('')) });

export async function createPost(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: { code: 'VALIDATION_ERROR' } };
  const supabase = await createClient();
  const { error } = await supabase.from('business_posts').insert({ ...parsed.data, cta_url: parsed.data.cta_url || null });
  if (error) return { ok: false, error: { code: 'DB_ERROR' } };
  revalidatePath('/gbp/posts');
  return { ok: true };
}
