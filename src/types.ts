export type DieFace = string;

export interface Tile {
  id: number;
  face: DieFace;
  row: number;
  col: number;
}

export type TileIndex = number;
export type GamePhase = 'idle' | 'playing' | 'ended';
export type FlashKind = 'valid' | 'invalid' | 'duplicate' | null;

export interface GameState {
  phase: GamePhase;
  tiles: Tile[];
  path: TileIndex[];
  foundWords: Map<string, number>;
  score: number;
  timeLeft: number;
  flash: FlashKind;
}

export type GameAction =
  | { type: 'START_ROUND' }
  | { type: 'NEW_ROUND'; tiles: Tile[] }
  | { type: 'TICK' }
  | { type: 'DRAG_START'; tileIndex: TileIndex }
  | { type: 'DRAG_ENTER'; tileIndex: TileIndex }
  | { type: 'DRAG_END' }
  | { type: 'CANCEL_DRAG' }
  | { type: 'WORD_RESULT'; kind: FlashKind; word: string; pts: number }
  | { type: 'CLEAR_FLASH' }
  | { type: 'END_ROUND' }
  | { type: 'SET_PATH'; path: number[] };
