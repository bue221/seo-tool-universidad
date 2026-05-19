import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLatestSnapshot, getProfile, listPosts } from '../_lib/queries';

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getProfile(user.id);
  const [posts, latest] = await Promise.all([
    profile ? listPosts(profile.id, 20) : Promise.resolve([]),
    getLatestSnapshot(user.id, profile?.website_url),
  ]);

  return (
    <Card>
      <CardHeader><CardTitle>Insights</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Posts: {posts.length}</p>
        <p>Website: {profile?.website_url ?? '—'}</p>
        <p>Latest snapshot: {latest ? latest.url : 'None'}</p>
      </CardContent>
    </Card>
  );
}
