'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { createReview } from '../_actions/create-review';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ReviewForm({ profileId }: { profileId: string }) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations('GBP.Reviews');

  return (
    <form className="space-y-3 rounded-lg border p-4" action={(fd) => {
      fd.set('profile_id', profileId);
      startTransition(() => {
        void (async () => {
          const result = await createReview(fd);
          if (!result.ok) {
            toast.error(t('createdError'));
            return;
          }
          toast.success(t('createdSuccess'));
        })();
      });
    }}>
      <Input name="author_name" placeholder={t('author')} />
      <Input name="rating" placeholder={t('rating')} type="number" min={1} max={5} />
      <Input name="body" placeholder={t('body')} />
      <Button type="submit" disabled={pending}>{t('create')}</Button>
    </form>
  );
}
