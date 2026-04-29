interface RecentWordsProps {
  foundWords: Map<string, number>;
  onViewAll: () => void;
}

const RECENT_COUNT = 2;

export function RecentWords({ foundWords, onViewAll }: RecentWordsProps) {
  // foundWords is insertion-ordered; reverse for newest first.
  const all = [...foundWords.entries()];
  const recent = all.slice(-RECENT_COUNT).reverse();
  const total = all.length;

  return (
    <div className="recent-words">
      <div className="recent-words-list">
        {recent.length === 0 ? (
          <span className="recent-words-empty">No words yet</span>
        ) : (
          recent.map(([word, pts]) => (
            <span key={word} className="recent-words-chip">
              <span className="recent-words-text">{word}</span>
              <span className="recent-words-pts">{pts}</span>
            </span>
          ))
        )}
      </div>
      <button type="button" className="view-all-btn" onClick={onViewAll}>
        View all ({total})
      </button>
    </div>
  );
}
