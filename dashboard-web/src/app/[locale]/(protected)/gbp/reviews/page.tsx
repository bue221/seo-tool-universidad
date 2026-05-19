import { getTranslations } from 'next-intl/server';

import { getCurrentUser } from '@/lib/auth';
import { getProfile, listReviews } from '../_lib/queries';
import { ReviewForm } from '../_components/ReviewForm';
import { ReviewsList } from '../_components/ReviewsList';

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  const reviews = profile ? await listReviews(profile.id) : [];
  const t = await getTranslations('GBP');

  if (!profile) return <p>{t('profileRequired')}</p>;

  return (
    <div className="space-y-4">
      <ReviewForm profileId={profile.id} />
      <ReviewsList reviews={reviews} />
    </div>
  );
}
