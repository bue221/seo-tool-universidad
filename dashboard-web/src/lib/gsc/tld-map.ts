/**
 * TLD → country distribution map.
 *
 * The first entry of each array is the dominant country for that TLD;
 * the rest fill out the top 20 with plausible neighbours. Weights are
 * applied at generation time (zipf-ish: position N gets ~ 1/N share).
 */

export interface CountryEntry {
  code: string; // ISO 3166-1 alpha-2
  name: string;
}

const BASE_COUNTRIES: CountryEntry[] = [
  { code: 'US', name: 'United States' },
  { code: 'ES', name: 'Spain' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'BR', name: 'Brazil' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'PH', name: 'Philippines' },
];

/** Returns 20 countries with the TLD-dominant one first. */
export function countriesForTLD(tld: string): CountryEntry[] {
  const t = tld.toLowerCase().replace(/^\./, '');
  const dominantByTLD: Record<string, string> = {
    es: 'ES',
    mx: 'MX',
    ar: 'AR',
    co: 'CO',
    cl: 'CL',
    pe: 'PE',
    uy: 'UY',
    br: 'BR',
    uk: 'GB',
    de: 'DE',
    fr: 'FR',
    it: 'IT',
    pt: 'PT',
    nl: 'NL',
    ca: 'CA',
    au: 'AU',
    in: 'IN',
    jp: 'JP',
  };
  const dominantCode = dominantByTLD[t] ?? 'US';
  const dominant = BASE_COUNTRIES.find((c) => c.code === dominantCode)!;
  const rest = BASE_COUNTRIES.filter((c) => c.code !== dominantCode);
  return [dominant, ...rest];
}

/** Extracts the TLD from a domain or URL. Always returns lowercase, no dot. */
export function tldOf(input: string): string {
  const host = input
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]!
    .split(':')[0]!;
  const parts = host.split('.');
  return parts.length > 1 ? parts[parts.length - 1]! : '';
}
