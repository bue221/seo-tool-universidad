/**
 * Locale-agnostic number formatters for the GSC views. We use the
 * `en-US` locale so the same dataset renders identically across users.
 */

const numFmt = new Intl.NumberFormat('en-US');

export function formatNumber(n: number): string {
  return numFmt.format(Math.round(n));
}

export function formatCTR(ctr: number): string {
  return `${(ctr * 100).toFixed(2)}%`;
}

export function formatPosition(pos: number): string {
  return pos.toFixed(1);
}

/**
 * Renders a positive/negative delta with sign and percentage points.
 * `metric` flips the meaning for position (lower is better).
 */
export function formatDelta(
  current: number,
  previous: number,
  metric: 'clicks' | 'impressions' | 'ctr' | 'position',
): { label: string; tone: 'up' | 'down' | 'neutral' } {
  if (previous === 0) return { label: '—', tone: 'neutral' };
  const diff = current - previous;
  if (metric === 'ctr') {
    const pp = (current - previous) * 100;
    return {
      label: `${pp >= 0 ? '+' : ''}${pp.toFixed(1)}pp`,
      tone: pp === 0 ? 'neutral' : pp > 0 ? 'up' : 'down',
    };
  }
  if (metric === 'position') {
    const delta = current - previous;
    return {
      label: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`,
      // Lower position is BETTER, so a negative delta is an improvement.
      tone: delta === 0 ? 'neutral' : delta < 0 ? 'up' : 'down',
    };
  }
  const pct = (diff / previous) * 100;
  return {
    label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
    tone: pct === 0 ? 'neutral' : pct > 0 ? 'up' : 'down',
  };
}
