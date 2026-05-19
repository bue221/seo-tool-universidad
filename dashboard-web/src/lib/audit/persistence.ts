import { createClient } from '@/lib/supabase/server';
import type { AuditResult, SnapshotRow } from './types';

export async function saveSnapshot(userId: string, audit: AuditResult) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('seo_snapshots')
    .insert({
      user_id: userId,
      url: audit.url,
      result: audit,
      global_score: audit.globalScore,
      partial_failure: audit.partialFailure,
      fetched_at: audit.fetchedAt,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function getSnapshot(snapshotId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('seo_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .maybeSingle();

  return (data as SnapshotRow | null) ?? null;
}

export async function listSnapshots(limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('seo_snapshots')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(limit);

  return (data as SnapshotRow[] | null) ?? [];
}
