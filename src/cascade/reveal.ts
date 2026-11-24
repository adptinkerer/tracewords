import { useCallback, useEffect, useState } from 'react';
import { LETTER_VALUES } from './config';
import type { RevealWord } from './types';

/** Rough difficulty: length dominates, rare letters add to it. */
export function difficulty(word: string): number {
  let v = 0;
  for (const ch of word) v += LETTER_VALUES[ch] ?? 0;
  return word.length * 4 + v;
}

/** Easiest, hardest, 2nd easiest, 2nd hardest, ... */
export function revealOrder<T extends { word: string }>(words: T[]): T[] {
  const sorted = words.slice().sort((a, b) => difficulty(a.word) - difficulty(b.word) || a.word.localeCompare(b.word));
  const out: T[] = [];
  let lo = 0, hi = sorted.length - 1;
  while (lo <= hi) {
    out.push(sorted[lo++]);
    if (lo <= hi) out.push(sorted[hi--]);
  }
  return out;
}

/**
 * Steps through words one letter at a time. Starts slow and speeds up so long
 * lists don't drag. Returns the partial path being traced and how many words
 * are fully revealed.
 */
export function useReveal(words: RevealWord[] | null) {
  const [pos, setPos] = useState({ i: 0, step: 0 });

  useEffect(() => { setPos({ i: 0, step: 0 }); }, [words]);

  useEffect(() => {
    if (!words || pos.i >= words.length) return;
    const w = words[pos.i];
    const pace = Math.pow(0.95, pos.i);
    const tracing = pos.step < w.path.length;
    const ms = tracing ? Math.max(40, 170 * pace) : Math.max(160, 750 * pace);
    const t = setTimeout(() => {
      setPos((p) => (p.step < w.path.length ? { i: p.i, step: p.step + 1 } : { i: p.i + 1, step: 0 }));
    }, pos.step === 0 && pos.i === 0 ? 500 : ms);
    return () => clearTimeout(t);
  }, [words, pos]);

  const skip = useCallback(() => setPos({ i: words?.length ?? 0, step: 0 }), [words]);

  if (!words) return { current: null, path: [] as number[], revealed: 0, done: true, skip };
  const done = pos.i >= words.length;
  const current = done ? null : words[pos.i];
  const fully = current && pos.step === current.path.length ? 1 : 0;
  return {
    current,
    path: current ? current.path.slice(0, pos.step) : [],
    revealed: pos.i + fully,
    done,
    skip,
  };
}
