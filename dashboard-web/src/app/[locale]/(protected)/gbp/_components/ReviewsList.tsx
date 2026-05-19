import { getTranslations } from 'next-intl/server';

import { addReviewResponse } from '../_actions/add-review-response';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export async function ReviewsList({ reviews }: { reviews: Array<Record<string, string | number | null>> }) {
  const t = await getTranslations('GBP.Reviews');

  if (!reviews.length) return <p className="text-sm text-muted-foreground">{t('empty')}</p>;

  return (
    <div className="space-y-2">
      {reviews.map((review) => (
        <Card key={String(review.id)}>
          <CardContent className="space-y-2 p-4">
            <p className="font-medium">{review.author_name} · {review.rating}★</p>
            <p className="text-sm">{review.body}</p>
            {review.response ? (
              <p className="text-xs text-muted-foreground">{t('response')}: {review.response}</p>
            ) : (
              <form action={addReviewResponse} className="flex gap-2">
                <input type="hidden" name="id" value={String(review.id)} />
                <Input name="response" placeholder={t('responsePlaceholder')} />
                <Button type="submit" variant="outline">{t('reply')}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
