import type { Tile } from '../types';
import { areAdjacent } from './adjacency';

/**
 * Find a path of tile indices that traces the given canonical word on the board.
 * Returns null if no valid trace exists. Returns the first valid path found.
 *
 * Word should be lowercase. 'Qu' tiles consume two characters ('qu') of the word.
 */
export function findPath(tiles: Tile[], word: string): number[] | null {
  if (!word) return null;
  const lower = word.toLowerCase();
  for (let i = 0; i < tiles.length; i++) {
    const visited = new Array(tiles.length).fill(false);
    const path: number[] = [];
    if (dfs(tiles, lower, 0, i, visited, path)) {
      return path;
    }
  }
  return null;
}

function dfs(
  tiles: Tile[],
  word: string,
  wIdx: number,
  tIdx: number,
  visited: boolean[],
  path: number[]
): boolean {
  const face = tiles[tIdx].face; // 1 char, or 'qu' (2 chars)
  if (word.slice(wIdx, wIdx + face.length) !== face) return false;

  visited[tIdx] = true;
  path.push(tIdx);
  const newWIdx = wIdx + face.length;

  if (newWIdx === word.length) return true;

  for (let n = 0; n < tiles.length; n++) {
    if (visited[n]) continue;
    if (!areAdjacent(tiles[tIdx], tiles[n])) continue;
    if (dfs(tiles, word, newWIdx, n, visited, path)) return true;
  }

  visited[tIdx] = false;
  path.pop();
  return false;
}
