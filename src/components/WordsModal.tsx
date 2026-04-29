import { useEffect } from 'react';
import { FoundWords } from './FoundWords';
import type { SortMode } from '../hooks/useSortMode';

interface WordsModalProps {
  open: boolean;
  foundWords: Map<string, number>;
  sortMode: SortMode;
  onSortChange: (m: SortMode) => void;
  onClose: () => void;
}

export function WordsModal({
  open,
  foundWords,
  sortMode,
  onSortChange,
  onClose,
}: WordsModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="words-modal-backdrop" onClick={onClose}>
      <div className="words-modal" onClick={(e) => e.stopPropagation()}>
        <div className="words-modal-header">
          <h2 className="words-modal-title">Found words</h2>
          <button type="button" className="words-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="words-modal-body">
          <FoundWords
            foundWords={foundWords}
            sortMode={sortMode}
            onSortChange={onSortChange}
          />
        </div>
      </div>
    </div>
  );
}
