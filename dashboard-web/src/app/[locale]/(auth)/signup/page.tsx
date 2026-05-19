import { getTranslations } from 'next-intl/server';
import { signUp } from '../_actions/sign-up';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function SignupPage() {
  const t = await getTranslations('Auth.Signup');

  return (
    <form action={signUp} className="space-y-3">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <Input name="displayName" placeholder={t('displayName')} required />
      <Input name="email" type="email" placeholder={t('email')} required />
      <Input name="password" type="password" placeholder={t('password')} required />
      <Button type="submit" className="w-full">{t('submit')}</Button>
      <p className="text-center text-xs text-muted-foreground">Already have an account? <Link href="/login" className="underline">Sign in</Link></p>
    </form>
  );
}
