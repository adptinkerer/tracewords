import type { Tile } from '../types';

export function areAdjacent(a: Tile, b: Tile): boolean {
  return (
    Math.abs(a.row - b.row) <= 1 &&
    Math.abs(a.col - b.col) <= 1 &&
    a.id !== b.id
  );
}
