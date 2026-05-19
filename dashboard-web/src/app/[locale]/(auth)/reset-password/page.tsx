import { getTranslations } from 'next-intl/server';
import { updatePassword } from '../_actions/update-password';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function ResetPasswordPage() {
  const t = await getTranslations('Auth.ResetPassword');

  return (
    <form action={updatePassword} className="space-y-3">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <Input name="password" type="password" placeholder={t('password')} required />
      <Input name="confirmPassword" type="password" placeholder={t('confirmPassword')} required />
      <Button type="submit" className="w-full">{t('submit')}</Button>
    </form>
  );
}
