import type { AuditResult } from '@/lib/audit/types';

export interface ComparisonEntry {
  /** Normalized URL the audit ran against. */
  url: string;
  status: 'ok' | 'error';
  error?: string;
  /** True for the user's own site, always the first entry. */
  isYou: boolean;
  audit?: AuditResult;
}

export interface ComparisonResult {
  ranAt: string;
  entries: ComparisonEntry[];
}

export type HeatmapTone = 'best' | 'worst' | 'mid' | 'neutral';

/** Direction in which a metric is "better": higher is better → 'asc'. */
export type MetricDirection = 'asc' | 'desc';
