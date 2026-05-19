import { getTranslations } from 'next-intl/server';

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
  const t = await getTranslations('GBP.Insights');

  return (
    <Card>
      <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{t('posts')}: {posts.length}</p>
        <p>{t('website')}: {profile?.website_url ?? '—'}</p>
        <p>{t('latestSnapshot')}: {latest ? latest.url : t('none')}</p>
      </CardContent>
    </Card>
  );
}
