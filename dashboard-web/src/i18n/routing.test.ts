import { describe, it, expect } from 'vitest';
import { routing } from './routing';

describe('routing config', () => {
  it('default locale es "es"', () => {
    expect(routing.defaultLocale).toBe('es');
  });

  it('locales incluye exactamente es y en', () => {
    expect([...routing.locales].sort()).toEqual(['en', 'es']);
  });

  it('localePrefix está en modo "as-needed"', () => {
    // next-intl puede normalizar internamente a un shape distinto;
    // tolerar tanto el string literal como un objeto con `mode`.
    const lp = routing.localePrefix;
    const matches =
      lp === 'as-needed' ||
      (typeof lp === 'object' && lp !== null && (lp as { mode?: string }).mode === 'as-needed');
    expect(matches).toBe(true);
  });

  it('default locale está incluido en locales', () => {
    expect(routing.locales).toContain(routing.defaultLocale);
  });
});
