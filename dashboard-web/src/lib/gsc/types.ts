/**
 * Search Console simulator types. Shape mirrors the public
 * `webmasters.searchanalytics.query` response so the same UI can be
 * fed by the real API later without changing components.
 */

export type GscRange = 7 | 28 | 90;

export interface GscMetrics {
  clicks: number;
  impressions: number;
  /** Click-through rate in [0, 1]. */
  ctr: number;
  /** Average position in [1, 100]. */
  position: number;
}

export interface GscSeriesPoint extends GscMetrics {
  /** YYYY-MM-DD, UTC. */
  date: string;
}

export interface GscDimensionRow extends GscMetrics {
  /** The query string or the page path. */
  key: string;
}

export type GscDevice = 'mobile' | 'desktop' | 'tablet';

export interface GscDeviceRow extends GscMetrics {
  device: GscDevice;
}

export interface GscCountryRow extends GscMetrics {
  /** ISO 3166-1 alpha-2, uppercase. */
  countryCode: string;
  /** English country name (we never localize this for parity with the real API). */
  countryName: string;
}

export interface GscDataset {
  property: string;
  range: GscRange;
  totals: GscMetrics;
  previousPeriodTotals: GscMetrics;
  series: GscSeriesPoint[];
  queries: GscDimensionRow[];
  pages: GscDimensionRow[];
  devices: GscDeviceRow[];
  countries: GscCountryRow[];
}
