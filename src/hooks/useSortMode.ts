import { useState, useEffect } from 'react';

export type SortMode = 'recent' | 'alpha' | 'score';

const STORAGE_KEY = 'boggle.foundWordsSort';
const VALID: SortMode[] = ['recent', 'alpha', 'score'];

function load(): SortMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && VALID.includes(v as SortMode)) return v as SortMode;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through
  }
  return 'recent';
}

export function useSortMode(): [SortMode, (m: SortMode) => void] {
  const [mode, setMode] = useState<SortMode>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore — preference just won't persist
    }
  }, [mode]);

  return [mode, setMode];
}
