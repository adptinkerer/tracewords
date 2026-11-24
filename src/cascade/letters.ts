import {
  LETTER_FREQ, LETTER_VALUES, VOWELS, TIERS, COIN_CHANCE, MULT_CHANCES, type Tier,
} from './config';
import type { CTile, Mult, PerkId } from './types';

const VOWEL_CEILING = 8; // never refill into a vowel-flooded board
const CONSONANTS = Object.keys(LETTER_FREQ).filter((l) => !VOWELS.includes(l));

export function tierIndex(score: number, perks: PerkId[]): number {
  let t = 0;
  for (let i = 0; i < TIERS.length; i++) if (score >= TIERS[i].minScore) t = i;
  if (perks.includes('easy')) t = Math.max(0, t - 1);
  return t;
}

function weightedPick(options: string[], weight: (l: string) => number): string {
  let total = 0;
  const ws = options.map((o) => { const w = weight(o); total += w; return w; });
  let r = Math.random() * total;
  for (let i = 0; i < options.length; i++) {
    r -= ws[i];
    if (r <= 0) return options[i];
  }
  return options[options.length - 1];
}

export function pickVowel(): string {
  return weightedPick(VOWELS, (l) => LETTER_FREQ[l]);
}

function pickConsonant(tier: Tier): string {
  return weightedPick(CONSONANTS, (l) => {
    const v = LETTER_VALUES[l];
    if (v > tier.maxValue) return 0;
    return LETTER_FREQ[l] * (1 + (tier.hardBoost * (v - 1)) / 3);
  });
}

export function isVowelFace(face: string): boolean {
  return VOWELS.includes(face);
}

function rollMult(perks: PerkId[]): Mult | null {
  const k = perks.includes('lucky') ? 2 : 1;
  const r = Math.random();
  let acc = 0;
  for (const m of ['TW', 'DW', 'TL', 'DL'] as Mult[]) {
    acc += MULT_CHANCES[m] * k;
    if (r < acc) return m;
  }
  return null;
}

export function makeTile(
  pos: number, uid: number, face: string, perks: PerkId[], extras = true,
): CTile {
  const coinChance = COIN_CHANCE * (perks.includes('magnet') ? 2 : 1);
  return {
    id: pos,
    row: Math.floor(pos / 4),
    col: pos % 4,
    face,
    uid,
    value: LETTER_VALUES[face] ?? 0,
    coin: extras && Math.random() < coinChance,
    mult: extras ? rollMult(perks) : null,
  };
}

/**
 * Refill the given positions. Draws at the tier for `score`, forcing vowels
 * while the board is below the tier's vowel floor (early-game safety net).
 */
export function refill(
  tiles: CTile[], positions: number[], score: number, perks: PerkId[], nextUid: number,
): { tiles: CTile[]; nextUid: number } {
  const tier = TIERS[tierIndex(score, perks)];
  const out = tiles.slice();
  const posSet = new Set(positions);
  let vowels = out.filter((t, i) => !posSet.has(i) && isVowelFace(t.face)).length;
  for (const p of positions) {
    let face: string;
    const forceVowel = vowels < tier.vowelFloor;
    if (forceVowel || (vowels < VOWEL_CEILING && Math.random() < tier.vowelShare)) {
      face = pickVowel();
      vowels++;
    } else {
      face = pickConsonant(tier);
    }
    out[p] = makeTile(p, nextUid++, face, perks);
  }
  return { tiles: out, nextUid };
}

export function initialBoard(nextUid: number): { tiles: CTile[]; nextUid: number } {
  const blank: CTile[] = Array.from({ length: 16 }, (_, i) => makeTile(i, 0, 'e', [], false));
  return refill(blank, Array.from({ length: 16 }, (_, i) => i), 0, [], nextUid);
}
