export type Mult = 'DL' | 'TL' | 'DW' | 'TW';

export interface CTile {
  id: number;       // board position 0-15 (shared Tile contract)
  row: number;
  col: number;
  face: string;     // 'a'..'z', 'qu', or '*' (wildcard)
  uid: number;      // changes on refill so the tile re-mounts and animates in
  value: number;    // point value (tile-bound so Remix can shuffle it)
  coin: boolean;
  mult: Mult | null;
}

export type ItemId = 'bomb' | 'vowel' | 'wild' | 'remix';

export type PerkId =
  | 'heavy' | 'goldrush' | 'longgame' | 'interest' | 'lucky'
  | 'magnet' | 'easy' | 'wildvalue' | 'streaker' | 'demo';

export type Phase = 'title' | 'playing' | 'clearing' | 'shop' | 'over';

export interface Flash {
  kind: 'valid' | 'invalid' | 'duplicate' | 'short' | 'info';
  text: string;
}

export interface PlayedWord {
  word: string;
  pts: number;
  coins: number;
  breakdown: string;
}

export interface RunState {
  phase: Phase;
  tiles: CTile[];
  path: number[];
  clearing: number[];
  level: number;
  levelScore: number;
  score: number;
  streak: number;
  coins: number;
  used: Set<string>;
  inventory: Record<ItemId, number>;
  purchases: Record<string, number>;
  perks: PerkId[];
  shopPerks: PerkId[];
  targeting: 'bomb' | 'wild' | null;
  flash: Flash | null;
  history: PlayedWord[];
  stuck: boolean;
  nextUid: number;
}
