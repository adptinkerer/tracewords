import { useState } from 'react';
import words from 'an-array-of-english-words';

export function useDictionary(): Set<string> {
  const [dict] = useState<Set<string>>(() => new Set(words as string[]));
  return dict;
}
