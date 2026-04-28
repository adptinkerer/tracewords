import { BOGGLE_DICE } from '../constants';
import type { Tile } from '../types';

const VOWEL_FACES = new Set(['a', 'e', 'i', 'o', 'u', 'qu']); // 'qu' contributes a U
const MIN_VOWELS = 2;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rollOnce(): Tile[] {
  const dieOrder = shuffle(BOGGLE_DICE.map((_, i) => i));
  return dieOrder.map((dieIndex, position) => {
    const faces = BOGGLE_DICE[dieIndex];
    const face = faces[Math.floor(Math.random() * faces.length)];
    return {
      id: position,
      face,
      row: Math.floor(position / 4),
      col: position % 4,
    };
  });
}

function vowelCount(tiles: Tile[]): number {
  return tiles.reduce((n, t) => n + (VOWEL_FACES.has(t.face) ? 1 : 0), 0);
}

export function generateBoard(): Tile[] {
  // Reroll until we hit the minimum vowel count. The dice distribution makes
  // <2 vowels rare, so this almost always succeeds on the first try.
  let tiles = rollOnce();
  let attempts = 0;
  while (vowelCount(tiles) < MIN_VOWELS && attempts < 50) {
    tiles = rollOnce();
    attempts++;
  }
  return tiles;
}
