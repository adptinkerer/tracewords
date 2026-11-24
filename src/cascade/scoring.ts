import { LETTER_VALUES, lengthMult } from './config';
import type { CTile, PerkId } from './types';

export interface ScoreResult {
  pts: number;
  coins: number;
  breakdown: string;
}

/** Letters each tile in the path stands for, given the resolved word. */
export function lettersForPath(path: number[], tiles: CTile[], word: string): string[] {
  const out: string[] = [];
  let w = 0;
  for (const i of path) {
    const f = tiles[i].face;
    const span = f === '*' ? 1 : f.length;
    out.push(word.slice(w, w + span));
    w += span;
  }
  return out;
}

export function scoreWord(
  path: number[], tiles: CTile[], word: string, perks: PerkId[], streak: number,
): ScoreResult {
  const letters = lettersForPath(path, tiles, word);
  let sum = 0;
  let wordMult = 1;
  let coins = 0;
  let heavy = 0;
  path.forEach((i, k) => {
    const t = tiles[i];
    let v = t.value;
    if (t.face === '*' && perks.includes('wildvalue')) v = LETTER_VALUES[letters[k]] ?? 0;
    if (t.mult === 'DL') v *= 2;
    if (t.mult === 'TL') v *= 3;
    if (t.mult === 'DW') wordMult *= 2;
    if (t.mult === 'TW') wordMult *= 3;
    sum += v;
    if (t.coin) coins += perks.includes('goldrush') ? 2 : 1;
    if (/[jqxz]/.test(letters[k])) heavy++;
  });

  const len = word.length;
  let lm = lengthMult(len);
  if (perks.includes('longgame') && len >= 6) lm *= 1.5;

  const parts = [`${sum}`];
  if (wordMult > 1) parts.push(`×${wordMult}`);
  if (lm !== 1) parts.push(`×${lm}`);
  let pts = Math.round(sum * wordMult * lm);

  if (perks.includes('heavy') && heavy > 0) { pts += 10 * heavy; parts.push(`+${10 * heavy}`); }
  if (perks.includes('streaker')) {
    const b = Math.floor(streak / 5);
    if (b > 0) { pts += b; parts.push(`+${b}`); }
  }
  return { pts, coins, breakdown: parts.join(' ') };
}
