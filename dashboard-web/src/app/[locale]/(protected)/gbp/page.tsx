import { redirect } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: 'es' | 'en' }> };

export default async function GbpLanding({ params }: Props) {
  const { locale } = await params;
  redirect({ href: '/gbp/profile', locale });
}
