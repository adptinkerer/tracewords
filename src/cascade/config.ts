// All Cascade balance knobs live here so tuning is one-file work.

export const LETTER_VALUES: Record<string, number> = {
  a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3,
  n: 1, o: 1, p: 3, qu: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10,
  '*': 0,
};

// Scrabble tile distribution, used as base draw weights.
export const LETTER_FREQ: Record<string, number> = {
  a: 9, b: 2, c: 2, d: 4, e: 12, f: 2, g: 3, h: 2, i: 9, j: 1, k: 1, l: 4, m: 2,
  n: 6, o: 8, p: 2, qu: 1, r: 6, s: 4, t: 6, u: 4, v: 2, w: 2, x: 1, y: 2, z: 1,
};

export const VOWELS = ['a', 'e', 'i', 'o', 'u'];

export interface Tier {
  name: string;
  minScore: number;    // total run score needed to reach this tier
  vowelShare: number;  // chance a refill is a vowel
  maxValue: number;    // highest letter value that can spawn
  hardBoost: number;   // extra weight for high-value letters
  vowelFloor: number;  // refills force vowels until the board has at least this many
}

export const TIERS: Tier[] = [
  { name: 'Gentle',    minScore: 0,    vowelShare: 0.38, maxValue: 2,  hardBoost: 0,   vowelFloor: 5 },
  { name: 'Steady',    minScore: 80,   vowelShare: 0.40, maxValue: 4,  hardBoost: 0,   vowelFloor: 4 },
  { name: 'Tricky',    minScore: 250,  vowelShare: 0.37, maxValue: 5,  hardBoost: 1,   vowelFloor: 3 },
  { name: 'Hard',      minScore: 600,  vowelShare: 0.34, maxValue: 10, hardBoost: 1.5, vowelFloor: 2 },
  { name: 'Brutal',    minScore: 1200, vowelShare: 0.30, maxValue: 10, hardBoost: 2.5, vowelFloor: 1 },
  { name: 'Nightmare', minScore: 2200, vowelShare: 0.27, maxValue: 10, hardBoost: 4,   vowelFloor: 0 },
];

export const COIN_CHANCE = 0.12;
export const MULT_CHANCES = { DL: 0.06, TL: 0.025, DW: 0.03, TW: 0.01 } as const;

// Length multiplier applied after letter sum and word multipliers.
export function lengthMult(len: number): number {
  if (len <= 4) return 1;
  if (len === 5) return 1.5;
  if (len === 6) return 2;
  if (len === 7) return 2.5;
  return 3;
}

// Points needed within a level to clear it.
export function levelTarget(level: number): number {
  return Math.round(25 * Math.pow(1.4, level - 1));
}

// Minimum word length — the pressure mechanic.
export function minLength(level: number): number {
  if (level <= 3) return 3;
  if (level <= 6) return 4;
  if (level <= 9) return 5;
  return 6;
}

export const LEVEL_CLEAR_BONUS = 3;
export const MAX_PERKS = 4;
export const STARTING_INVENTORY = { bomb: 1, consonant: 0, vowel: 0, wild: 0, remix: 0, shuffle: 0 };

// Consonants sell while letters are Gentle/Steady (vowel-rich); Vowels sell after.
export const CONSONANT_MAX_TIER = 1;

export function price(base: number, level: number, bought: number): number {
  return base + Math.floor((level - 1) / 2) + bought;
}

export function perkPrice(level: number): number {
  return 6 + level;
}
