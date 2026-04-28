import { SCORE_TABLE } from '../constants';
import { letterCount } from './wordBuilder';

export function scoreWord(canonical: string): number {
  const len = letterCount(canonical);
  for (const [min, pts] of SCORE_TABLE) {
    if (len >= min) return pts;
  }
  return 0;
}
