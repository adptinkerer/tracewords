import { areAdjacent } from '../utils/adjacency';
import type { CTile } from './types';

// Sorted copy of the dictionary for O(log n) prefix checks. Unlike the base
// solver's candidate filter, this works with wildcards (any letter possible).
let cachedFor: Set<string> | null = null;
let sorted: string[] = [];

function sortedDict(dict: Set<string>): string[] {
  if (cachedFor !== dict) {
    sorted = Array.from(dict).sort();
    cachedFor = dict;
  }
  return sorted;
}

function hasPrefix(arr: string[], p: string): boolean {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < p) lo = mid + 1; else hi = mid;
  }
  return lo < arr.length && arr[lo].startsWith(p);
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

/** Returns one playable word (length >= minLen, not in `used`), or null if stuck. */
export function findAnyWord(
  tiles: CTile[], dict: Set<string>, minLen: number, used: Set<string>,
): string | null {
  const arr = sortedDict(dict);
  const neighbors = tiles.map((t) => tiles.filter((o) => areAdjacent(t, o)).map((o) => o.id));
  const visited = new Array(tiles.length).fill(false);
  let found: string | null = null;

  function visit(idx: number, next: string): boolean {
    if (!hasPrefix(arr, next)) return false;
    if (next.length >= minLen && dict.has(next) && !used.has(next)) {
      found = next;
      return true;
    }
    visited[idx] = true;
    for (const n of neighbors[idx]) {
      if (!visited[n] && dfs(n, next)) { visited[idx] = false; return true; }
    }
    visited[idx] = false;
    return false;
  }

  function dfs(idx: number, current: string): boolean {
    const face = tiles[idx].face;
    if (face === '*') {
      for (const ch of ALPHA) if (visit(idx, current + ch)) return true;
      return false;
    }
    return visit(idx, current + face);
  }

  for (let i = 0; i < tiles.length; i++) if (dfs(i, '')) return found;
  return null;
}

/**
 * Resolve a traced pattern containing '*' into a dictionary word.
 * Prefers unused words. Returns { word, duplicate } or null if none match.
 */
export function resolvePattern(
  pattern: string, dict: Set<string>, used: Set<string>,
): { word: string; duplicate: boolean } | null {
  if (!pattern.includes('*')) {
    if (!dict.has(pattern)) return null;
    return { word: pattern, duplicate: used.has(pattern) };
  }
  let dupe: string | null = null;
  const chars = pattern.split('');
  const holes = chars.map((c, i) => (c === '*' ? i : -1)).filter((i) => i >= 0);
  const total = Math.pow(26, holes.length);
  for (let n = 0; n < total; n++) {
    let k = n;
    for (const h of holes) { chars[h] = ALPHA[k % 26]; k = Math.floor(k / 26); }
    const w = chars.join('');
    if (dict.has(w)) {
      if (!used.has(w)) return { word: w, duplicate: false };
      dupe ??= w;
    }
  }
  return dupe ? { word: dupe, duplicate: true } : null;
}
