import { getTranslations } from 'next-intl/server';
import { signIn } from '../_actions/sign-in';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function LoginPage() {
  const t = await getTranslations('Auth.Login');

  return (
    <form action={signIn} className="space-y-3">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <Input name="email" type="email" placeholder={t('email')} required />
      <Input name="password" type="password" placeholder={t('password')} required />
      <Button type="submit" className="w-full">{t('submit')}</Button>
      <div className="flex justify-between text-xs text-muted-foreground">
        <Link href="/signup" className="underline">Create account</Link>
        <Link href="/forgot-password" className="underline">Forgot password</Link>
      </div>
    </form>
  );
}
