'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({ id: z.string().uuid(), response: z.string().min(2) });

export async function addReviewResponse(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: { code: 'VALIDATION_ERROR' } };
  const supabase = await createClient();
  const { error } = await supabase
    .from('business_reviews')
    .update({ response: parsed.data.response, responded_at: new Date().toISOString() })
    .eq('id', parsed.data.id);
  if (error) return { ok: false, error: { code: 'DB_ERROR' } };
  revalidatePath('/gbp/reviews');
  return { ok: true };
}
