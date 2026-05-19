'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({ profile_id: z.string().uuid(), author_name: z.string().min(2), rating: z.coerce.number().int().min(1).max(5), body: z.string().min(2) });

export async function createReview(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: { code: 'VALIDATION_ERROR' } };
  const supabase = await createClient();
  const { error } = await supabase.from('business_reviews').insert(parsed.data);
  if (error) return { ok: false, error: { code: 'DB_ERROR' } };
  revalidatePath('/gbp/reviews');
  return { ok: true };
}
