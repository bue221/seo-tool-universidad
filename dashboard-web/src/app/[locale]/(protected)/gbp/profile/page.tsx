import { getCurrentUser } from '@/lib/auth';
import { getProfile } from '../_lib/queries';
import { BusinessProfileForm } from '../_components/BusinessProfileForm';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;

  return <BusinessProfileForm profile={profile} />;
}
