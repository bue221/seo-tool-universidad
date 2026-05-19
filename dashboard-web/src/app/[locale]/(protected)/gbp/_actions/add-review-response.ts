'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({ id: z.string().uuid(), response: z.string().min(2) });

export async function addReviewResponse(formData: FormData): Promise<void> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from('business_reviews')
    .update({ response: parsed.data.response, responded_at: new Date().toISOString() })
    .eq('id', parsed.data.id);
  if (error) return;
  revalidatePath('/gbp/reviews');
}
