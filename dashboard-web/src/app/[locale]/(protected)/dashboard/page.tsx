import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';

export default async function DashboardPage() {
  const t = await getTranslations('Auth.Dashboard');
  const user = await getCurrentUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>{t('welcome', { name: user?.displayName ?? user?.email ?? 'there' })}</p>
        <ul className="list-disc pl-4">
          <li>/audit</li>
          <li>/gbp</li>
          <li>/analytics</li>
        </ul>
      </CardContent>
    </Card>
  );
}
