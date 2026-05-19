import 'server-only';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { normalizeDomain } from '@/lib/gsc/generator';

/**
 * GSC "verified properties" are derived from the user's previous audits:
 * every distinct URL the user has run through `/audit` becomes a property.
 *
 * Rationale: matches the UX of "first audit, then explore in GSC" and
 * removes the need for a dedicated table. The real Search Console requires
 * domain ownership verification — we collapse that into "you audited it".
 */
export async function listUserProperties(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('seo_snapshots')
    .select('url')
    .eq('user_id', userId)
    .order('fetched_at', { ascending: false })
    .limit(200);

  if (error || !data) return [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of data) {
    const normalized = normalizeDomain((row as { url: string }).url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
    if (out.length >= 50) break;
  }
  return out;
}

/**
 * Server-side guard: if `property` does not belong to the user's audit
 * history, fall through to a 404. Avoids leaking arbitrary GSC datasets.
 */
export async function assertUserOwnsProperty(
  userId: string,
  property: string,
): Promise<string> {
  const normalized = normalizeDomain(property);
  const properties = await listUserProperties(userId);
  if (!properties.includes(normalized)) {
    notFound();
  }
  return normalized;
}
