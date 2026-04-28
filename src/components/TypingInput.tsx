import { useState, useEffect, useRef } from 'react';
import type { Tile } from '../types';
import { findPath } from '../utils/findPath';

interface TypingInputProps {
  active: boolean;
  tiles: Tile[];
  setPath: (path: number[]) => void;
  submitTypedWord: (word: string) => void;
}

export function TypingInput({ active, tiles, setPath, submitTypedWord }: TypingInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the round becomes active
  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  // Clear input + path when the round ends
  useEffect(() => {
    if (!active) {
      setValue('');
      setPath([]);
    }
  }, [active, setPath]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Letters only; lowercase
    const clean = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
    setValue(clean);
    if (clean.length === 0) {
      setPath([]);
      return;
    }
    const path = findPath(tiles, clean);
    setPath(path ?? []);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!value) return;
      submitTypedWord(value);
      setValue('');
      setPath([]);
    } else if (e.key === 'Escape') {
      setValue('');
      setPath([]);
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      className="typing-input"
      placeholder="...or type a word, then press Enter"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={!active}
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
    />
  );
}
