'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { createPost } from '../_actions/create-post';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PostForm({ profileId }: { profileId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form className="space-y-3 rounded-lg border p-4" action={(fd) => {
      fd.set('profile_id', profileId);
      startTransition(async () => {
        const result = await createPost(fd);
        if (!result.ok) return toast.error('Could not create post');
        toast.success('Post created');
      });
    }}>
      <Input name="title" placeholder="Title" />
      <Input name="body" placeholder="Body" />
      <Input name="cta_label" placeholder="CTA label" />
      <Input name="cta_url" placeholder="https://example.com" />
      <Button type="submit" disabled={pending}>Create post</Button>
    </form>
  );
}
