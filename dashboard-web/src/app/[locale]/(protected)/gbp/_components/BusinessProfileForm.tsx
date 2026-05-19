'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { upsertProfile } from '../_actions/upsert-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function BusinessProfileForm({ profile }: { profile: Record<string, unknown> | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 rounded-lg border p-4"
      action={(fd) => {
        startTransition(async () => {
          const result = await upsertProfile(fd);
          if (!result.ok) return toast.error('Could not save profile');
          toast.success('Profile saved');
        });
      }}
    >
      <Input name="business_name" placeholder="Business name" defaultValue={(profile?.business_name as string) ?? ''} />
      <Input name="category" placeholder="Category" defaultValue={(profile?.category as string) ?? ''} />
      <Input name="description" placeholder="Description" defaultValue={(profile?.description as string) ?? ''} />
      <Input name="address" placeholder="Address" defaultValue={(profile?.address as string) ?? ''} />
      <Input name="phone" placeholder="Phone" defaultValue={(profile?.phone as string) ?? ''} />
      <Input name="website_url" placeholder="https://example.com" defaultValue={(profile?.website_url as string) ?? ''} />
      <Button type="submit" disabled={pending}>Save profile</Button>
    </form>
  );
}
