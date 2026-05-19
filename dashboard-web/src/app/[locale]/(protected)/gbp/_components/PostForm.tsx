'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { createPost } from '../_actions/create-post';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PostForm({ profileId }: { profileId: string }) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations('GBP.Posts');

  return (
    <form className="space-y-3 rounded-lg border p-4" action={(fd) => {
      fd.set('profile_id', profileId);
      startTransition(() => {
        void (async () => {
          const result = await createPost(fd);
          if (!result.ok) {
            toast.error(t('createdError'));
            return;
          }
          toast.success(t('createdSuccess'));
        })();
      });
    }}>
      <Input name="title" placeholder={t('title')} />
      <Input name="body" placeholder={t('body')} />
      <Input name="cta_label" placeholder={t('ctaLabel')} />
      <Input name="cta_url" placeholder={t('ctaUrl')} />
      <Button type="submit" disabled={pending}>{t('create')}</Button>
    </form>
  );
}
