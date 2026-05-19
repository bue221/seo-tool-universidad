import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSnapshot } from '@/lib/audit/persistence';
import { KeywordsSection } from '../_components/KeywordsSection';
import { OnPageSection } from '../_components/OnPageSection';
import { PageSpeedSection } from '../_components/PageSpeedSection';
import { ScoreBadge } from '../_components/ScoreBadge';
import { SentimentSection } from '../_components/SentimentSection';
import { TrackingSection } from '../_components/TrackingSection';

type Props = { params: Promise<{ snapshotId: string }> };

export default async function SnapshotDetailPage({ params }: Props) {
  const { snapshotId } = await params;
  const snapshot = await getSnapshot(snapshotId);
  const t = await getTranslations('Audit.Result.Common');

  if (!snapshot) notFound();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">{snapshot.url}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-sm">{t('globalScore')}</span>
          <ScoreBadge score={Number(snapshot.global_score)} />
        </div>
      </div>

      <Tabs defaultValue="pagespeed">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="pagespeed">PageSpeed</TabsTrigger>
          <TabsTrigger value="onpage">On-Page</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
        </TabsList>
        <TabsContent value="pagespeed">
          <PageSpeedSection result={snapshot.result} />
        </TabsContent>
        <TabsContent value="onpage">
          <OnPageSection result={snapshot.result} />
        </TabsContent>
        <TabsContent value="tracking">
          <TrackingSection result={snapshot.result} />
        </TabsContent>
        <TabsContent value="keywords">
          <KeywordsSection result={snapshot.result} />
        </TabsContent>
        <TabsContent value="sentiment">
          <SentimentSection result={snapshot.result} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
