import 'server-only';

import { mulberry32, randInt, randRange, seedFromDomain, shuffle } from './prng';
import { countriesForTLD, tldOf } from './tld-map';
import type {
  GscCountryRow,
  GscDataset,
  GscDeviceRow,
  GscDimensionRow,
  GscMetrics,
  GscRange,
  GscSeriesPoint,
} from './types';
import {
  AUDIENCES,
  BRAND_PATTERNS,
  LONGTAIL_PATTERNS,
  PAGE_PATTERNS,
  SLUGS,
  TOPICS,
} from './vocab';

const QUERIES_COUNT = 50;
const PAGES_COUNT = 50;
const COUNTRIES_COUNT = 20;

/**
 * Returns a fully populated synthetic Search Console dataset.
 *
 * Deterministic: same `(domain, range)` → identical output. Domain is
 * normalized first so casing or trailing slashes don't change the seed.
 *
 * Performance: ~O(range + 100). Safe to call inline from a server component.
 */
export async function getGscDataset(
  domain: string,
  range: GscRange,
): Promise<GscDataset> {
  const property = normalizeDomain(domain);
  const baseSeed = await seedFromDomain(property);

  // Each section gets its own PRNG forked off the base seed. This means
  // we can tweak one section's logic without altering the others.
  const seriesRand = mulberry32(baseSeed ^ 0xa1);
  const queriesRand = mulberry32(baseSeed ^ 0xb2);
  const pagesRand = mulberry32(baseSeed ^ 0xc3);
  const devicesRand = mulberry32(baseSeed ^ 0xd4);
  const countriesRand = mulberry32(baseSeed ^ 0xe5);

  const series = generateSeries(property, range, seriesRand);
  const totals = sumSeries(series);

  // Previous-period totals: regenerate the prior `range` days with a
  // shifted seed. We don't expose those points, just the aggregate.
  const prevSeries = generateSeries(property, range, mulberry32((baseSeed ^ 0xa1) ^ 0xf6));
  const previousPeriodTotals = scaleDown(sumSeries(prevSeries), 0.85 + 0.3 * (seriesRand() - 0.5));

  const queries = generateQueries(property, totals, queriesRand);
  const pages = generatePages(totals, pagesRand);
  const devices = generateDevices(totals, devicesRand);
  const countries = generateCountries(property, totals, countriesRand);

  return {
    property,
    range,
    totals,
    previousPeriodTotals,
    series,
    queries,
    pages,
    devices,
    countries,
  };
}

// ---- normalization -----------------------------------------------------

/**
 * Strip protocol, trailing slash, and lowercase. Keeps subdomains intact
 * so `blog.example.com` and `example.com` produce independent datasets.
 */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

// ---- series ------------------------------------------------------------

function generateSeries(
  domain: string,
  range: GscRange,
  rand: () => number,
): GscSeriesPoint[] {
  const out: GscSeriesPoint[] = [];
  // Bigger domain names get more "authority" → more baseline impressions.
  const sizeBoost = Math.min(domain.length, 30) * 200;

  // We anchor the series to a fixed "today" so determinism survives across
  // requests. Using the real `now()` would defeat reproducibility.
  const today = new Date(Date.UTC(2026, 4, 18)); // 2026-05-18

  for (let i = range - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i);
    const dow = date.getUTCDay(); // 0 = Sunday
    const weekendMultiplier = dow === 0 || dow === 6 ? 0.7 : 1.15;

    const impressions = Math.round(
      (500 + sizeBoost + randRange(rand, 0, 4000)) * weekendMultiplier,
    );
    const ctr = clamp(randRange(rand, 0.015, 0.12), 0, 1);
    const clicks = Math.round(impressions * ctr);
    const position = clamp(8 + randRange(rand, -3, 12), 1, 100);

    out.push({
      date: date.toISOString().slice(0, 10),
      clicks,
      impressions,
      ctr,
      position,
    });
  }
  return out;
}

function sumSeries(series: GscSeriesPoint[]): GscMetrics {
  let clicks = 0;
  let impressions = 0;
  let positionSum = 0;
  for (const p of series) {
    clicks += p.clicks;
    impressions += p.impressions;
    positionSum += p.position;
  }
  const ctr = impressions === 0 ? 0 : clicks / impressions;
  const position = series.length === 0 ? 0 : positionSum / series.length;
  return { clicks, impressions, ctr, position };
}

function scaleDown(m: GscMetrics, factor: number): GscMetrics {
  const f = clamp(factor, 0.4, 1.4);
  const impressions = Math.round(m.impressions * f);
  const clicks = Math.round(m.clicks * f);
  const ctr = impressions === 0 ? 0 : clicks / impressions;
  // Position drifts inversely: previous period had slightly worse rank.
  const position = clamp(m.position * (2 - f), 1, 100);
  return { clicks, impressions, ctr, position };
}

// ---- queries -----------------------------------------------------------

function brandFromDomain(domain: string): string {
  return domain.split('.')[0]!;
}

function generateQueries(
  domain: string,
  totals: GscMetrics,
  rand: () => number,
): GscDimensionRow[] {
  const brand = brandFromDomain(domain);
  const brandQueries = BRAND_PATTERNS.map((p) => p.replace('{brand}', brand));

  // Long-tail: shuffle topics × audiences × patterns and take the first 40.
  const longtail: string[] = [];
  const shuffledPatterns = shuffle(rand, LONGTAIL_PATTERNS);
  const shuffledTopics = shuffle(rand, TOPICS);
  const shuffledAudiences = shuffle(rand, AUDIENCES);
  outer: for (const pattern of shuffledPatterns) {
    for (const topic of shuffledTopics) {
      for (const audience of shuffledAudiences) {
        longtail.push(
          pattern.replace('{topic}', topic).replace('{audience}', audience),
        );
        if (longtail.length >= QUERIES_COUNT - brandQueries.length) break outer;
      }
    }
  }

  const allTerms = [...brandQueries, ...longtail].slice(0, QUERIES_COUNT);

  // Allocate impressions zipf-style: top query gets ~25% of the total,
  // the rest decays as 1 / (rank + 1).
  const rows = allocateMetrics(
    allTerms,
    totals,
    rand,
    /* brandIndices = */ new Set(brandQueries.map((_, i) => i)),
  );

  // Sort by clicks desc (matches what GSC shows by default).
  return rows.sort((a, b) => b.clicks - a.clicks);
}

// ---- pages -------------------------------------------------------------

function generatePages(totals: GscMetrics, rand: () => number): GscDimensionRow[] {
  const paths: string[] = [];
  const shuffledSlugs = shuffle(rand, SLUGS);
  for (const pattern of PAGE_PATTERNS) {
    if (!pattern.includes('{slug}')) {
      paths.push(pattern);
      continue;
    }
    for (const slug of shuffledSlugs) {
      paths.push(pattern.replace('{slug}', slug));
      if (paths.length >= PAGES_COUNT) break;
    }
    if (paths.length >= PAGES_COUNT) break;
  }
  while (paths.length < PAGES_COUNT) {
    paths.push(`/p/${paths.length}`);
  }

  const rows = allocateMetrics(paths.slice(0, PAGES_COUNT), totals, rand);
  return rows.sort((a, b) => b.clicks - a.clicks);
}

// ---- devices -----------------------------------------------------------

function generateDevices(totals: GscMetrics, rand: () => number): GscDeviceRow[] {
  // Realistic split with jitter ±5pp.
  const mobile = clamp(0.6 + randRange(rand, -0.05, 0.05), 0, 1);
  const desktop = clamp(0.35 + randRange(rand, -0.05, 0.05), 0, 1);
  const tabletRaw = 1 - mobile - desktop;
  const tablet = clamp(tabletRaw, 0.01, 0.15);

  const share = { mobile, desktop, tablet };
  return (['mobile', 'desktop', 'tablet'] as const).map((d) => ({
    device: d,
    clicks: Math.round(totals.clicks * share[d]),
    impressions: Math.round(totals.impressions * share[d]),
    ctr: totals.ctr * (0.95 + 0.1 * rand()), // small variation per device
    position: clamp(totals.position + randRange(rand, -2, 2), 1, 100),
  }));
}

// ---- countries ---------------------------------------------------------

function generateCountries(
  domain: string,
  totals: GscMetrics,
  rand: () => number,
): GscCountryRow[] {
  const countries = countriesForTLD(tldOf(domain)).slice(0, COUNTRIES_COUNT);
  const weights = zipfWeights(countries.length);

  return countries.map((c, i) => ({
    countryCode: c.code,
    countryName: c.name,
    clicks: Math.round(totals.clicks * weights[i]!),
    impressions: Math.round(totals.impressions * weights[i]!),
    ctr: clamp(totals.ctr * (0.7 + 0.6 * rand()), 0, 1),
    position: clamp(totals.position + randRange(rand, -3, 5), 1, 100),
  }));
}

// ---- helpers -----------------------------------------------------------

function allocateMetrics(
  keys: string[],
  totals: GscMetrics,
  rand: () => number,
  brandIndices?: Set<number>,
): GscDimensionRow[] {
  const weights = zipfWeights(keys.length);

  return keys.map((key, i) => {
    const isBrand = brandIndices?.has(i) ?? false;
    // Brand queries: higher CTR, better position. Long-tail: the opposite.
    const ctrFactor = isBrand ? randRange(rand, 1.5, 2.5) : randRange(rand, 0.5, 1.0);
    const posOffset = isBrand ? randRange(rand, -4, 0) : randRange(rand, 0, 8);

    const impressions = Math.max(1, Math.round(totals.impressions * weights[i]!));
    const ctr = clamp(totals.ctr * ctrFactor, 0, 1);
    const clicks = Math.min(impressions, Math.round(impressions * ctr));
    const position = clamp(totals.position + posOffset, 1, 100);

    return { key, clicks, impressions, ctr, position };
  });
}

/**
 * Zipf-like normalized weights: `w_i = (1 / (i + 1)^s) / Σ`.
 * Heavier head, long tail. Used to spread totals across dimension rows.
 */
function zipfWeights(n: number, s = 1.1): number[] {
  const raw: number[] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const w = 1 / Math.pow(i + 1, s);
    raw.push(w);
    sum += w;
  }
  return raw.map((w) => w / sum);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
