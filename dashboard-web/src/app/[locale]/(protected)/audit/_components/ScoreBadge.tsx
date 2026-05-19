import { Badge } from '@/components/ui/badge';

export function ScoreBadge({ score }: { score: number }) {
  const rounded = Math.round(score);
  const variant = rounded < 50 ? 'destructive' : rounded < 80 ? 'secondary' : 'default';
  return <Badge variant={variant}>{rounded}</Badge>;
}
