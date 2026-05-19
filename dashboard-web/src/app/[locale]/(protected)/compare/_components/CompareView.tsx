'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComparisonForm } from './ComparisonForm';
import { ComparisonRadar } from './ComparisonRadar';
import { ComparisonTable } from './ComparisonTable';
import { KeywordGap } from './KeywordGap';
import type { ComparisonResult } from '../_lib/types';

interface CompareViewProps {
  formLabels: React.ComponentProps<typeof ComparisonForm>['labels'];
  tableLabels: React.ComponentProps<typeof ComparisonTable>['labels'];
  radarLabels: React.ComponentProps<typeof ComparisonRadar>['labels'];
  keywordLabels: React.ComponentProps<typeof KeywordGap>['labels'];
  tabLabels: { table: string; radar: string; keywords: string };
  ranAtLabel: string;
}

/**
 * Client wrapper that owns the comparison result state. We keep this
 * a single client island so the result can be updated in-place after
 * submit without a page navigation or persistence round-trip.
 */
export function CompareView({
  formLabels,
  tableLabels,
  radarLabels,
  keywordLabels,
  tabLabels,
  ranAtLabel,
}: CompareViewProps) {
  const [result, setResult] = useState<ComparisonResult | null>(null);

  return (
    <div className="space-y-6">
      <ComparisonForm onResult={setResult} labels={formLabels} />

      {result ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {ranAtLabel}: {new Date(result.ranAt).toLocaleString()}
          </p>

          <Tabs defaultValue="table">
            <TabsList>
              <TabsTrigger value="table">{tabLabels.table}</TabsTrigger>
              <TabsTrigger value="radar">{tabLabels.radar}</TabsTrigger>
              <TabsTrigger value="keywords">{tabLabels.keywords}</TabsTrigger>
            </TabsList>
            <TabsContent value="table">
              <ComparisonTable entries={result.entries} labels={tableLabels} />
            </TabsContent>
            <TabsContent value="radar">
              <ComparisonRadar entries={result.entries} labels={radarLabels} />
            </TabsContent>
            <TabsContent value="keywords">
              <KeywordGap entries={result.entries} labels={keywordLabels} />
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </div>
  );
}
