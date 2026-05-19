import { createClient } from '@/lib/supabase/server';

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function listPosts(profileId: string, limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('business_posts')
    .select('*')
    .eq('profile_id', profileId)
    .order('published_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listReviews(profileId: string, limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('business_reviews')
    .select('*')
    .eq('profile_id', profileId)
    .order('reviewed_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getLatestSnapshot(userId: string, websiteUrl?: string | null) {
  const supabase = await createClient();
  let query = supabase
    .from('seo_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('fetched_at', { ascending: false })
    .limit(1);
  if (websiteUrl) query = query.eq('url', websiteUrl);
  const { data } = await query.maybeSingle();
  return data;
}
