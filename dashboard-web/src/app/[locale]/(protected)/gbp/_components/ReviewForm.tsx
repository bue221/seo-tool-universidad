'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { createReview } from '../_actions/create-review';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ReviewForm({ profileId }: { profileId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form className="space-y-3 rounded-lg border p-4" action={(fd) => {
      fd.set('profile_id', profileId);
      startTransition(async () => {
        const result = await createReview(fd);
        if (!result.ok) return toast.error('Could not create review');
        toast.success('Review created');
      });
    }}>
      <Input name="author_name" placeholder="Author" />
      <Input name="rating" placeholder="1-5" type="number" min={1} max={5} />
      <Input name="body" placeholder="Review body" />
      <Button type="submit" disabled={pending}>Create review</Button>
    </form>
  );
}
