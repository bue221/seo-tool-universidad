'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { runAudit } from '../_actions/run-audit';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  url: z.string().url().max(2000),
});

export function AuditForm({ locale }: { locale: 'es' | 'en' }) {
  const t = useTranslations('Audit.Form');
  const te = useTranslations('Audit.Errors');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: '' },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const fd = new FormData();
    fd.set('url', values.url);
    fd.set('locale', locale);

    const loadingId = toast.loading(t('loading'));

    startTransition(async () => {
      const result = await runAudit(fd);
      toast.dismiss(loadingId);

      if (!result.ok) {
        toast.error(te(result.error.code));
        return;
      }

      toast.success(t('success'));
      router.push({ href: `/audit/${result.snapshotId}`, locale });
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form className="space-y-4 rounded-lg border p-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
