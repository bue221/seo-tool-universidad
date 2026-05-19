'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { saveSnapshot } from '@/lib/audit/persistence';
import { runFullAudit } from '@/lib/audit/run';

const inputSchema = z.object({
  url: z.string().url().max(2000).refine((v) => /^https?:\/\//.test(v), {
    message: 'INVALID_URL',
  }),
  locale: z.enum(['es', 'en']).default('es'),
});

export async function runAudit(formData: FormData) {
  const parsed = inputSchema.safeParse({
    url: formData.get('url'),
    locale: formData.get('locale') ?? 'es',
  });

  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_URL' } } as const;
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: { code: 'UNAUTHORIZED' } } as const;
  }

  const audit = await runFullAudit(parsed.data.url);
  if (!audit) {
    return { ok: false, error: { code: 'UPSTREAM_BOTH_FAILED' } } as const;
  }

  const snapshotId = await saveSnapshot(user.id, audit);
  revalidatePath(`/${parsed.data.locale}/audit`);

  return { ok: true, snapshotId } as const;
}
