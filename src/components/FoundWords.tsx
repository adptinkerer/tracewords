import type { SortMode } from '../hooks/useSortMode';

interface FoundWordsProps {
  foundWords: Map<string, number>;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
}

function sortedEntries(map: Map<string, number>, mode: SortMode): [string, number][] {
  const entries = [...map.entries()];
  switch (mode) {
    case 'alpha':
      return entries.sort((a, b) => a[0].localeCompare(b[0]));
    case 'score':
      // higher score first, alpha tiebreak
      return entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    case 'recent':
    default:
      return entries.reverse();
  }
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'alpha', label: 'A-Z' },
  { value: 'score', label: 'Score' },
];

export function FoundWords({ foundWords, sortMode, onSortChange }: FoundWordsProps) {
  const entries = sortedEntries(foundWords, sortMode);
  const count = entries.length;

  return (
    <div className="found-words">
      <div className="found-words-header">
        <h3 className="found-words-title">Found words ({count})</h3>
        <div className="sort-toggle" role="group" aria-label="Sort found words">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`sort-toggle-btn${sortMode === opt.value ? ' active' : ''}`}
              onClick={() => onSortChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {count === 0 ? (
        <p className="no-words">No words found yet</p>
      ) : (
        <ul className="found-words-list">
          {entries.map(([word, pts]) => (
            <li key={word} className="found-word-item">
              <span className="found-word-text">{word}</span>
              <span className="found-word-pts">{pts}pt</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
