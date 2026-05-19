export type PartialFailureCode =
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'INVALID_RESPONSE'
  | 'UNREACHABLE'
  | 'UPSTREAM_5XX';

export type PartialFailure = {
  pagespeed?: PartialFailureCode;
  scraper?: PartialFailureCode;
};

export type PageSpeedScores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  fcp?: string;
  lcp?: string;
  cls?: string;
  tbt?: string;
};

export type ScraperAudit = {
  url: string;
  fetchedAt: string;
  onPage: {
    title: { value: string; lengthScore: number };
    metaDescription: { value: string; lengthScore: number };
    h1: { count: number; value: string };
    images: { total: number; withAlt: number; altCoverage: number };
  };
  tracking: {
    gtm: { detected: boolean; ids: string[] };
    ga4: { detected: boolean; ids: string[] };
    googleAds: { detected: boolean; ids: string[] };
  };
  keywords: { top: Array<{ term: string; density: number }> };
  sentiment: { polarity: 'positive' | 'neutral' | 'negative'; score: number };
};

export type AuditResult = {
  url: string;
  fetchedAt: string;
  pagespeed: PageSpeedScores | null;
  scraper: ScraperAudit | null;
  globalScore: number;
  partialFailure: PartialFailure | null;
};

export type SnapshotRow = {
  id: string;
  user_id: string;
  url: string;
  result: AuditResult;
  global_score: number;
  partial_failure: PartialFailure | null;
  fetched_at: string;
};
