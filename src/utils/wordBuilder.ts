import type { Tile, TileIndex } from '../types';

export function pathToWord(
  path: TileIndex[],
  tiles: Tile[]
): { display: string; canonical: string } {
  const faces = path.map((i) => tiles[i].face);
  return {
    display: faces.map((f) => (f === 'qu' ? 'Qu' : f.toUpperCase())).join(''),
    canonical: faces.join(''),
  };
}

// 'qu' is stored as 2 chars, so canonical.length naturally gives the correct letter count
export function letterCount(canonical: string): number {
  return canonical.length;
}
