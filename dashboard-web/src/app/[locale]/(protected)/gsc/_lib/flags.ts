/**
 * Converts an ISO 3166-1 alpha-2 country code into the regional indicator
 * emoji sequence (🇦🇷 = 🇦 + 🇷). Pure function, no external dep.
 *
 * Returns an empty string when the input is not exactly two ASCII letters.
 */
export function flagFor(code: string): string {
  if (!/^[a-zA-Z]{2}$/.test(code)) return '';
  const upper = code.toUpperCase();
  // 0x1F1E6 = regional indicator A. Offset = letter index from 'A'.
  const base = 0x1f1e6 - 'A'.charCodeAt(0);
  return String.fromCodePoint(base + upper.charCodeAt(0), base + upper.charCodeAt(1));
}
