import type { Tile } from '../types';
import { areAdjacent } from './adjacency';
import { scoreWord } from './scoring';
import { MIN_WORD_LETTERS } from '../constants';

/**
 * Find every valid word on the board by DFS.
 * Returns a map of canonical word -> point value.
 *
 * Strategy:
 *   1. Filter dictionary to words composed only of the letters present on the board
 *      (typically reduces 275k -> a few thousand candidates).
 *   2. Build a prefix set from those candidates so the DFS can prune dead branches early.
 *   3. DFS from every tile, no tile reuse within a path.
 *
 * Runs in well under a second on a normal 4x4 grid.
 */
export function solveBoard(tiles: Tile[], dict: Set<string>): Map<string, number> {
  // 1. Letters available (treat 'qu' as contributing both 'q' and 'u')
  const boardLetters = new Set<string>();
  for (const t of tiles) {
    for (const ch of t.face) boardLetters.add(ch);
  }

  // 2. Candidate words + prefix set
  const candidates = new Set<string>();
  const prefixes = new Set<string>();
  for (const word of dict) {
    if (word.length < MIN_WORD_LETTERS || word.length > 16) continue;
    let ok = true;
    for (const ch of word) {
      if (!boardLetters.has(ch)) { ok = false; break; }
    }
    if (!ok) continue;
    candidates.add(word);
    for (let i = 1; i <= word.length; i++) prefixes.add(word.slice(0, i));
  }

  // 3. Pre-compute adjacency by tile id
  const neighbors: number[][] = tiles.map((t) =>
    tiles.filter((o) => areAdjacent(t, o)).map((o) => o.id)
  );

  const results = new Map<string, number>();
  const visited = new Array(tiles.length).fill(false);

  function dfs(idx: number, current: string) {
    const next = current + tiles[idx].face;
    if (!prefixes.has(next)) return;

    visited[idx] = true;

    if (next.length >= MIN_WORD_LETTERS && candidates.has(next) && !results.has(next)) {
      results.set(next, scoreWord(next));
    }
    for (const n of neighbors[idx]) {
      if (!visited[n]) dfs(n, next);
    }

    visited[idx] = false;
  }

  for (let i = 0; i < tiles.length; i++) dfs(i, '');
  return results;
}

export function totalScore(words: Map<string, number>): number {
  let sum = 0;
  for (const pts of words.values()) sum += pts;
  return sum;
}
