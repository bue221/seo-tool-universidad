'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  business_name: z.string().min(2),
  category: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal('')),
});

export async function upsertProfile(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: { code: 'VALIDATION_ERROR' } };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { code: 'UNAUTHORIZED' } };

  const supabase = await createClient();
  const { error } = await supabase.from('business_profiles').upsert({
    user_id: user.id,
    ...parsed.data,
    website_url: parsed.data.website_url || null,
  });

  if (error) return { ok: false, error: { code: 'DB_ERROR', message: error.message } };
  revalidatePath('/gbp/profile');
  return { ok: true };
}
