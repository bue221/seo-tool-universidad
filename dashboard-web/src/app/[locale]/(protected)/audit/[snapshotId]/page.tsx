import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSnapshot } from '@/lib/audit/persistence';

import { KeywordsSection } from '../_components/KeywordsSection';
import { OnPageSection } from '../_components/OnPageSection';
import { PageSpeedSection } from '../_components/PageSpeedSection';
import { ScoreBadge } from '../_components/ScoreBadge';
import { SentimentSection } from '../_components/SentimentSection';
import { TrackingSection } from '../_components/TrackingSection';
import { WoorankSection } from '../_components/WoorankSection';

type Props = { params: Promise<{ snapshotId: string }> };

/**
 * Audit detail page (ui-cc-pages).
 *
 * - Header con PageHeader (sin accent — el dominio es texto plano) + score
 *   global como action a la derecha.
 * - Tabs envueltas en SectionCard surface para que respeten el lenguaje
 *   visual; el contenido interno de cada sección se conserva tal cual.
 */
export default async function SnapshotDetailPage({ params }: Props) {
  const { snapshotId } = await params;
  const snapshot = await getSnapshot(snapshotId);
  const t = await getTranslations('Audit.Result.Common');
  const tDetail = await getTranslations('Audit.Detail');

  if (!snapshot) notFound();

  // Display-friendly del URL: dominio sin protocolo, sin trailing slash.
  let domain = snapshot.url;
  try {
    domain = new URL(snapshot.url).hostname.replace(/^www\./, '');
  } catch {
    /* Fallback al URL crudo si no parsea. */
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={tDetail('title')}
        accent={domain}
        size="sm"
        description={snapshot.url}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-tracked-label text-muted-foreground">
              {t('globalScore')}
            </span>
            <ScoreBadge score={Number(snapshot.global_score)} />
          </div>
        }
      />

      <SectionCard
        eyebrow={tDetail('detailsEyebrow')}
        bodyClassName="p-0"
      >
        <Tabs defaultValue="pagespeed" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent px-4">
            <TabsTrigger value="pagespeed">{tDetail('tabs.pagespeed')}</TabsTrigger>
            <TabsTrigger value="onpage">{tDetail('tabs.onpage')}</TabsTrigger>
            {snapshot.result.scraper?.woorank ? (
              <TabsTrigger value="woorank">{tDetail('tabs.woorank')}</TabsTrigger>
            ) : null}
            <TabsTrigger value="tracking">{tDetail('tabs.tracking')}</TabsTrigger>
            <TabsTrigger value="keywords">{tDetail('tabs.keywords')}</TabsTrigger>
            <TabsTrigger value="sentiment">{tDetail('tabs.sentiment')}</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="pagespeed">
              <PageSpeedSection result={snapshot.result} />
            </TabsContent>
            <TabsContent value="onpage">
              <OnPageSection result={snapshot.result} />
            </TabsContent>
            {snapshot.result.scraper?.woorank ? (
              <TabsContent value="woorank">
                <WoorankSection result={snapshot.result} />
              </TabsContent>
            ) : null}
            <TabsContent value="tracking">
              <TrackingSection result={snapshot.result} />
            </TabsContent>
            <TabsContent value="keywords">
              <KeywordsSection result={snapshot.result} />
            </TabsContent>
            <TabsContent value="sentiment">
              <SentimentSection result={snapshot.result} />
            </TabsContent>
          </div>
        </Tabs>
      </SectionCard>
    </div>
  );
}
