import { getTranslations } from 'next-intl/server';

import { getCurrentUser } from '@/lib/auth';
import { getProfile, listPosts } from '../_lib/queries';
import { PostForm } from '../_components/PostForm';
import { PostsList } from '../_components/PostsList';

export default async function PostsPage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  const posts = profile ? await listPosts(profile.id) : [];
  const t = await getTranslations('GBP');

  if (!profile) return <p>{t('profileRequired')}</p>;

  return (
    <div className="space-y-4">
      <PostForm profileId={profile.id} />
      <PostsList posts={posts} />
    </div>
  );
}
