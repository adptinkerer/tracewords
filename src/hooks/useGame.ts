import { useReducer, useEffect, useRef, useCallback } from 'react';
import type { GameState, GameAction, Tile } from '../types';
import { ROUND_SECONDS, MIN_WORD_LETTERS } from '../constants';
import { generateBoard } from '../utils/dice';
import { areAdjacent } from '../utils/adjacency';
import { pathToWord, letterCount } from '../utils/wordBuilder';
import { scoreWord } from '../utils/scoring';
import { findPath } from '../utils/findPath';

function buildInitialState(tiles: Tile[]): GameState {
  return {
    phase: 'idle',
    tiles,
    path: [],
    foundWords: new Map(),
    score: 0,
    timeLeft: ROUND_SECONDS,
    flash: null,
  };
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_ROUND':
      if (state.phase !== 'idle') return state;
      return { ...state, phase: 'playing' };

    case 'NEW_ROUND':
      return buildInitialState(action.tiles);

    case 'TICK': {
      if (state.phase !== 'playing') return state;
      const next = state.timeLeft - 1;
      if (next <= 0) {
        return { ...state, timeLeft: 0, phase: 'ended', path: [] };
      }
      return { ...state, timeLeft: next };
    }

    case 'DRAG_START':
      if (state.phase !== 'playing') return state;
      return { ...state, path: [action.tileIndex] };

    case 'DRAG_ENTER': {
      if (state.phase !== 'playing' || state.path.length === 0) return state;
      const idx = action.tileIndex;
      const lastIdx = state.path[state.path.length - 1];

      // Backtrack: re-entering the second-to-last tile pops the head
      if (state.path.length >= 2 && idx === state.path[state.path.length - 2]) {
        return { ...state, path: state.path.slice(0, -1) };
      }

      // Already in path (loop detection — ignore)
      if (state.path.includes(idx)) return state;

      // Must be adjacent to the last tile
      const lastTile = state.tiles[lastIdx];
      const nextTile = state.tiles[idx];
      if (!areAdjacent(lastTile, nextTile)) return state;

      return { ...state, path: [...state.path, idx] };
    }

    case 'DRAG_END':
      return { ...state, path: [] };

    case 'CANCEL_DRAG':
      return { ...state, path: [] };

    case 'WORD_RESULT': {
      if (action.kind !== 'valid') {
        return { ...state, path: [], flash: action.kind };
      }
      const newFoundWords = new Map(state.foundWords);
      newFoundWords.set(action.word, action.pts);
      return {
        ...state,
        path: [],
        foundWords: newFoundWords,
        score: state.score + action.pts,
        flash: 'valid',
      };
    }

    case 'CLEAR_FLASH':
      return { ...state, flash: null };

    case 'END_ROUND':
      if (state.phase !== 'playing') return state;
      return { ...state, phase: 'ended', path: [], timeLeft: 0 };

    case 'SET_PATH':
      if (state.phase !== 'playing') return state;
      return { ...state, path: action.path };

    default:
      return state;
  }
}

export function useGame(dict: Set<string>) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    buildInitialState(generateBoard())
  );

  const isDragging = useRef(false);
  // Keep a ref to current state for use inside event handlers
  const stateRef = useRef(state);
  stateRef.current = state;

  // Timer
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [state.phase]);

  // Flash timeout
  useEffect(() => {
    if (!state.flash) return;
    const id = setTimeout(() => dispatch({ type: 'CLEAR_FLASH' }), 600);
    return () => clearTimeout(id);
  }, [state.flash]);

  // Global mouseup — catches mouseup outside the grid
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      submitWord(stateRef.current);
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  function submitWord(s: GameState, pathOverride?: number[]) {
    const path = pathOverride ?? s.path;
    if (path.length === 0) return;
    const { canonical } = pathToWord(path, s.tiles);
    const len = letterCount(canonical);

    if (len < MIN_WORD_LETTERS) {
      // Too short — no feedback flash, just clear silently
      dispatch({ type: 'DRAG_END' });
      return;
    }
    if (s.foundWords.has(canonical)) {
      dispatch({ type: 'WORD_RESULT', kind: 'duplicate', word: canonical, pts: 0 });
      return;
    }
    if (!dict.has(canonical)) {
      dispatch({ type: 'WORD_RESULT', kind: 'invalid', word: canonical, pts: 0 });
      return;
    }
    const pts = scoreWord(canonical);
    dispatch({ type: 'WORD_RESULT', kind: 'valid', word: canonical, pts });
  }

  const onDragStart = useCallback((tileIndex: number) => {
    isDragging.current = true;
    dispatch({ type: 'DRAG_START', tileIndex });
  }, []);

  const onDragEnter = useCallback((tileIndex: number) => {
    if (!isDragging.current) return;
    dispatch({ type: 'DRAG_ENTER', tileIndex });
  }, []);

  const onDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    submitWord(stateRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dict]);

  const onCancelDrag = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    dispatch({ type: 'CANCEL_DRAG' });
  }, []);

  const startRound = useCallback(() => dispatch({ type: 'START_ROUND' }), []);

  const newRound = useCallback(() => {
    dispatch({ type: 'NEW_ROUND', tiles: generateBoard() });
  }, []);

  const giveUp = useCallback(() => dispatch({ type: 'END_ROUND' }), []);

  const setPath = useCallback((path: number[]) => {
    dispatch({ type: 'SET_PATH', path });
  }, []);

  // Submit a word entered via typing. Looks up a trace path; if none exists or
  // word is too short, shows the invalid flash. Otherwise routes through the
  // same submitWord pipeline as drag.
  const submitTypedWord = useCallback((word: string) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    const lower = word.toLowerCase();
    if (lower.length < MIN_WORD_LETTERS) {
      dispatch({ type: 'WORD_RESULT', kind: 'invalid', word: lower, pts: 0 });
      return;
    }
    const path = findPath(s.tiles, lower);
    if (!path) {
      // Letters don't form a valid trace on this board
      dispatch({ type: 'WORD_RESULT', kind: 'invalid', word: lower, pts: 0 });
      return;
    }
    submitWord(s, path);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dict]);

  return {
    state,
    startRound,
    newRound,
    giveUp,
    setPath,
    submitTypedWord,
    onDragStart,
    onDragEnter,
    onDragEnd,
    onCancelDrag,
  };
}
