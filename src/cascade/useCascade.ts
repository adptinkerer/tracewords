import { useCallback, useEffect, useRef, useState } from 'react';
import type { CTile, Flash, ItemId, PerkId, RunState } from './types';
import {
  CONSONANT_MAX_TIER, LEVEL_CLEAR_BONUS, MAX_PERKS, STARTING_INVENTORY, levelTarget, minLength, price, perkPrice,
} from './config';
import { ITEM_BY_ID, PERKS } from './items';
import { initialBoard, isVowelFace, makeTile, pickConsonantAt, pickVowel, refill, tierIndex } from './letters';
import { findAllWords, findAnyWord, resolvePattern } from './solver';
import { revealOrder } from './reveal';
import { scoreWord } from './scoring';
import { findPath } from '../utils/findPath';

const CLEAR_MS = 380;

function freshRun(): RunState {
  const { tiles, nextUid } = initialBoard(1);
  return {
    phase: 'title',
    tiles,
    path: [],
    clearing: [],
    level: 1,
    levelScore: 0,
    score: 0,
    streak: 0,
    coins: 0,
    used: new Set(),
    inventory: { ...STARTING_INVENTORY },
    purchases: {},
    perks: [],
    shopPerks: [],
    targeting: null,
    flash: null,
    history: [],
    stuck: false,
    gaveUp: false,
    remaining: [],
    nextUid,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hasItems(s: RunState): boolean {
  return Object.values(s.inventory).some((n) => n > 0);
}

/** Which items the shop sells right now. */
export function itemForSale(s: RunState, id: ItemId): boolean {
  const tier = tierIndex(s.score, s.perks);
  if (id === 'consonant') return tier <= CONSONANT_MAX_TIER;
  if (id === 'vowel') return tier > CONSONANT_MAX_TIER;
  return true;
}

export function itemPrice(s: RunState, id: ItemId): number {
  return price(ITEM_BY_ID[id].basePrice, s.level, s.purchases[id] ?? 0);
}

export function useCascade(dict: Set<string>) {
  const [state, setState] = useState<RunState>(freshRun);
  const ref = useRef(state);
  ref.current = state;
  const dragging = useRef(false);

  const commit = useCallback((s: RunState) => {
    ref.current = s;
    setState(s);
  }, []);

  /** Re-check whether any word is playable; ends the run if stuck with no items. */
  const withStuckCheck = useCallback((s: RunState): RunState => {
    const any = findAnyWord(s.tiles, dict, minLength(s.level), s.used);
    if (any) return { ...s, stuck: false };
    if (!hasItems(s)) return { ...s, stuck: true, phase: 'over', path: [], targeting: null };
    return {
      ...s, stuck: true,
      flash: { kind: 'info', text: 'Stuck! Use an item or end the run.' },
    };
  }, [dict]);

  // Flash timeout
  useEffect(() => {
    if (!state.flash || state.flash.kind === 'info') return;
    const id = setTimeout(() => commit({ ...ref.current, flash: null }), 900);
    return () => clearTimeout(id);
  }, [state.flash, commit]);

  function flash(kind: Flash['kind'], text: string) {
    commit({ ...ref.current, path: [], flash: { kind, text } });
  }

  function submit(path: number[], typed?: string) {
    const s = ref.current;
    if (s.phase !== 'playing' || path.length === 0) return;
    const pattern = typed ?? path.map((i) => s.tiles[i].face).join('');
    const minLen = minLength(s.level);
    if (pattern.length < minLen) {
      if (path.length > 1 || typed) flash('short', `Min ${minLen} letters`);
      else commit({ ...s, path: [] });
      return;
    }
    const res = resolvePattern(pattern, dict, s.used);
    if (!res) return flash('invalid', `${pattern.toUpperCase().replace(/\*/g, '?')} — not a word`);
    if (res.duplicate) return flash('duplicate', `${res.word.toUpperCase()} — already played`);

    const { pts, coins, breakdown } = scoreWord(path, s.tiles, res.word, s.perks, s.streak);
    const streak = s.streak + 1;
    const inventory = { ...s.inventory };
    let bonus = '';
    if (s.perks.includes('demo') && streak % 8 === 0) {
      inventory.bomb++;
      bonus = ' · free 💣';
    }
    const used = new Set(s.used);
    used.add(res.word);
    commit({
      ...s,
      phase: 'clearing',
      clearing: path,
      path: [],
      score: s.score + pts,
      levelScore: s.levelScore + pts,
      coins: s.coins + coins,
      streak,
      used,
      inventory,
      history: [{ word: res.word, pts, coins, breakdown }, ...s.history],
      flash: {
        kind: 'valid',
        text: `${res.word.toUpperCase()} +${pts}${coins ? ` · +${coins}🪙` : ''}${bonus}`,
      },
    });

    setTimeout(() => {
      const c = ref.current;
      const r = refill(c.tiles, c.clearing, c.score, c.perks, c.nextUid);
      let next: RunState = { ...c, tiles: r.tiles, nextUid: r.nextUid, clearing: [], phase: 'playing' };
      if (next.levelScore >= levelTarget(next.level)) {
        next = enterShop(next);
      } else {
        next = withStuckCheck(next);
      }
      commit(next);
    }, CLEAR_MS);
  }

  function enterShop(s: RunState): RunState {
    let coins = s.coins + LEVEL_CLEAR_BONUS;
    if (s.perks.includes('interest')) coins += Math.min(5, Math.floor(s.coins / 5));
    const offer = shuffle(PERKS.map((p) => p.id).filter((id) => !s.perks.includes(id))).slice(0, 2);
    return { ...s, phase: 'shop', coins, shopPerks: offer, targeting: null, stuck: false, flash: null };
  }

  // ---- Input ----
  const onDragStart = useCallback((idx: number) => {
    const s = ref.current;
    if (s.phase !== 'playing') return;
    if (s.targeting) { applyTargeted(idx); return; }
    dragging.current = true;
    commit({ ...s, path: [idx] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragEnter = useCallback((idx: number) => {
    if (!dragging.current) return;
    const s = ref.current;
    const p = s.path;
    if (p.length === 0) return;
    if (p.length >= 2 && idx === p[p.length - 2]) return commit({ ...s, path: p.slice(0, -1) });
    if (p.includes(idx)) return;
    const last = s.tiles[p[p.length - 1]];
    const t = s.tiles[idx];
    if (Math.abs(last.row - t.row) > 1 || Math.abs(last.col - t.col) > 1) return;
    commit({ ...s, path: [...p, idx] });
  }, [commit]);

  const onDragEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    submit(ref.current.path);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dict]);

  const onCancelDrag = useCallback(() => {
    dragging.current = false;
    commit({ ...ref.current, path: [] });
  }, [commit]);

  const setPath = useCallback((path: number[]) => {
    if (ref.current.phase !== 'playing') return;
    commit({ ...ref.current, path });
  }, [commit]);

  const submitTypedWord = useCallback((word: string) => {
    const s = ref.current;
    const lower = word.toLowerCase();
    const path = findPath(s.tiles, lower);
    if (!path) return flash('invalid', `${lower.toUpperCase()} — not on the board`);
    submit(path, lower);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dict]);

  // ---- Items ----
  function applyTargeted(idx: number) {
    const s = ref.current;
    const old = s.tiles[idx];
    let tiles: CTile[];
    let nextUid = s.nextUid;
    const inventory = { ...s.inventory };
    let msg: string;
    if (s.targeting === 'bomb') {
      const r = refill(s.tiles, [idx], s.score, s.perks, nextUid);
      tiles = r.tiles; nextUid = r.nextUid;
      inventory.bomb--;
      msg = `💣 Boom — ${old.face.toUpperCase()} is gone`;
    } else {
      const t = { ...makeTile(idx, nextUid++, '*', s.perks, false), coin: old.coin, mult: old.mult };
      tiles = s.tiles.slice(); tiles[idx] = t;
      inventory.wild--;
      msg = '❔ Blank placed';
    }
    commit(withStuckCheck({ ...s, tiles, nextUid, inventory, targeting: null, flash: { kind: 'valid', text: msg } }));
  }

  const applyItem = useCallback((id: ItemId) => {
    const s = ref.current;
    if (s.phase !== 'playing' || s.inventory[id] <= 0) return;
    if (id === 'bomb' || id === 'wild') {
      commit({ ...s, targeting: s.targeting === id ? null : id, path: [] });
      return;
    }
    const inventory = { ...s.inventory, [id]: s.inventory[id] - 1 };
    let tiles = s.tiles.slice();
    let nextUid = s.nextUid;
    let msg = '';
    if (id === 'vowel') {
      const cands = tiles.filter((t) => !isVowelFace(t.face) && t.face !== '*');
      if (cands.length === 0) return flash('info', 'No consonants to replace');
      const pick = cands[Math.floor(Math.random() * cands.length)];
      const v = pickVowel();
      tiles[pick.id] = { ...makeTile(pick.id, nextUid++, v, s.perks, false), coin: pick.coin, mult: pick.mult };
      msg = `🅰️ ${pick.face.toUpperCase()} → ${v.toUpperCase()}`;
    } else if (id === 'consonant') {
      const cands = tiles.filter((t) => isVowelFace(t.face));
      if (cands.length === 0) return flash('info', 'No vowels to replace');
      const pick = cands[Math.floor(Math.random() * cands.length)];
      const c = pickConsonantAt(s.score, s.perks);
      tiles[pick.id] = { ...makeTile(pick.id, nextUid++, c, s.perks, false), coin: pick.coin, mult: pick.mult };
      msg = `🅱️ ${pick.face.toUpperCase()} → ${c === 'qu' ? 'Qu' : c.toUpperCase()}`;
    } else if (id === 'shuffle') {
      tiles = shuffle(tiles).map((t, i) => ({
        ...t, id: i, row: Math.floor(i / 4), col: i % 4, uid: nextUid++,
      }));
      msg = '🔀 Board shuffled';
    } else {
      const vals = shuffle(tiles.map((t) => t.value));
      tiles = tiles.map((t, i) => ({ ...t, value: vals[i] }));
      msg = '🎲 Values remixed';
    }
    commit(withStuckCheck({ ...s, tiles, nextUid, inventory, targeting: null, flash: { kind: 'valid', text: msg } }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dict]);

  // ---- Shop ----
  const buyItem = useCallback((id: ItemId) => {
    const s = ref.current;
    const cost = itemPrice(s, id);
    if (s.phase !== 'shop' || s.coins < cost || !itemForSale(s, id)) return;
    commit({
      ...s,
      coins: s.coins - cost,
      inventory: { ...s.inventory, [id]: s.inventory[id] + 1 },
      purchases: { ...s.purchases, [id]: (s.purchases[id] ?? 0) + 1 },
    });
  }, [commit]);

  const buyPerk = useCallback((id: PerkId) => {
    const s = ref.current;
    const cost = perkPrice(s.level);
    if (s.phase !== 'shop' || s.coins < cost || s.perks.length >= MAX_PERKS) return;
    commit({ ...s, coins: s.coins - cost, perks: [...s.perks, id], shopPerks: s.shopPerks.filter((p) => p !== id) });
  }, [commit]);

  const nextLevel = useCallback(() => {
    const s = ref.current;
    if (s.phase !== 'shop') return;
    commit(withStuckCheck({ ...s, phase: 'playing', level: s.level + 1, levelScore: 0 }));
  }, [commit, withStuckCheck]);

  // ---- Run lifecycle ----
  const startRun = useCallback(() => {
    let s = freshRun();
    for (let i = 0; i < 20 && !findAnyWord(s.tiles, dict, minLength(1), s.used); i++) s = freshRun();
    commit(withStuckCheck({ ...s, phase: 'playing' }));
  }, [commit, withStuckCheck, dict]);

  /** Give up: list every word still on the board, then trace them (phase 'reveal'). */
  const giveUp = useCallback(() => {
    const s = ref.current;
    if (s.phase !== 'playing') return;
    const words = findAllWords(s.tiles, dict, minLength(s.level), s.used).map(({ word, path }) => ({
      word, path, pts: scoreWord(path, s.tiles, word, s.perks, s.streak).pts,
    }));
    commit({
      ...s, phase: 'reveal', gaveUp: true, path: [], targeting: null, flash: null,
      remaining: revealOrder(words),
    });
  }, [commit, dict]);

  const finishReveal = useCallback(() => {
    commit({ ...ref.current, phase: 'over' });
  }, [commit]);

  const endRun = useCallback(() => {
    commit({ ...ref.current, phase: 'over', path: [], targeting: null });
  }, [commit]);

  return {
    state,
    startRun, endRun, giveUp, finishReveal, nextLevel,
    onDragStart, onDragEnter, onDragEnd, onCancelDrag,
    setPath, submitTypedWord,
    applyItem, buyItem, buyPerk,
  };
}
