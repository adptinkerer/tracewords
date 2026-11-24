import type { ItemId, PerkId } from './types';

export interface ItemDef {
  id: ItemId;
  name: string;
  icon: string;
  basePrice: number;
  desc: string;
}

export const ITEMS: ItemDef[] = [
  { id: 'bomb',  name: 'Bomb',     icon: '💣', basePrice: 3, desc: 'Blow up a tile you pick. It refills at your current difficulty.' },
  { id: 'vowel', name: 'Vowel',    icon: '🅰️', basePrice: 2, desc: 'Turns a random consonant into a vowel.' },
  { id: 'wild',  name: 'Blank',    icon: '❔', basePrice: 5, desc: 'Turn a tile you pick into a blank that counts as any letter. Scores 0.' },
  { id: 'remix', name: 'Remix',    icon: '🎲', basePrice: 3, desc: 'Shuffles every point value on the board.' },
];

export interface PerkDef {
  id: PerkId;
  name: string;
  desc: string;
}

export const PERKS: PerkDef[] = [
  { id: 'heavy',     name: 'Heavy Hitter', desc: '+10 pts for each J, Q, X or Z in a word.' },
  { id: 'goldrush',  name: 'Gold Rush',    desc: 'Coin tiles bank 2 coins instead of 1.' },
  { id: 'longgame',  name: 'Long Game',    desc: 'Words of 6+ letters score ×1.5.' },
  { id: 'interest',  name: 'Interest',     desc: 'On level clear, +1 coin per 5 held (max +5).' },
  { id: 'lucky',     name: 'Lucky Squares', desc: 'Multiplier tiles spawn twice as often.' },
  { id: 'magnet',    name: 'Coin Magnet',  desc: 'Coin tiles spawn twice as often.' },
  { id: 'easy',      name: 'Easy Street',  desc: 'Refills draw from one difficulty tier easier.' },
  { id: 'wildvalue', name: 'True Blank',   desc: 'Blanks score the value of the letter they stand in for.' },
  { id: 'streaker',  name: 'Streaker',     desc: '+1 pt per word for every 5 words in your streak.' },
  { id: 'demo',      name: 'Demolition',   desc: 'Every 8th word grants a free Bomb.' },
];

export const PERK_BY_ID = Object.fromEntries(PERKS.map((p) => [p.id, p])) as Record<PerkId, PerkDef>;
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<ItemId, ItemDef>;
