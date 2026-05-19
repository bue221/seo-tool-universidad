import { getTranslations } from 'next-intl/server';
import { requestPasswordReset } from '../_actions/request-password-reset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function ForgotPasswordPage() {
  const t = await getTranslations('Auth.ForgotPassword');

  return (
    <form action={requestPasswordReset} className="space-y-3">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <Input name="email" type="email" placeholder={t('email')} required />
      <Button type="submit" className="w-full">{t('submit')}</Button>
    </form>
  );
}
