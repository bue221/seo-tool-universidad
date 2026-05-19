'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { upsertProfile } from '../_actions/upsert-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function BusinessProfileForm({ profile }: { profile: Record<string, unknown> | null }) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations('GBP.Profile');

  return (
    <form
      className="space-y-3 rounded-lg border p-4"
      action={(fd) => {
        startTransition(() => {
          void (async () => {
            const result = await upsertProfile(fd);
            if (!result.ok) {
              toast.error(t('savedError'));
              return;
            }
            toast.success(t('savedSuccess'));
          })();
        });
      }}
    >
      <Input name="business_name" placeholder={t('businessName')} defaultValue={(profile?.business_name as string) ?? ''} />
      <Input name="category" placeholder={t('category')} defaultValue={(profile?.category as string) ?? ''} />
      <Input name="description" placeholder={t('description')} defaultValue={(profile?.description as string) ?? ''} />
      <Input name="address" placeholder={t('address')} defaultValue={(profile?.address as string) ?? ''} />
      <Input name="phone" placeholder={t('phone')} defaultValue={(profile?.phone as string) ?? ''} />
      <Input name="website_url" placeholder={t('website')} defaultValue={(profile?.website_url as string) ?? ''} />
      <Button type="submit" disabled={pending}>{t('save')}</Button>
    </form>
  );
}
