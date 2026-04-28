import { MIN_WORD_LETTERS } from '../constants';
import { letterCount } from './wordBuilder';

/**
 * Linear scoring: each letter beyond 2 is worth +1 point.
 *   3 letters → 1pt, 4 → 2pt, 5 → 3pt, 6 → 4pt, 7 → 5pt, 8 → 6pt, ...
 * Qu still counts as 2 letters via letterCount().
 */
export function scoreWord(canonical: string): number {
  const len = letterCount(canonical);
  if (len < MIN_WORD_LETTERS) return 0;
  return len - 2;
}
