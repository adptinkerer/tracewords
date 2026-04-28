import { useState } from 'react';

interface RoundSummaryProps {
  score: number;
  winTarget: number;
  foundWords: Map<string, number>;
  allWords: Map<string, number>;
}

export function RoundSummary({ score, winTarget, foundWords, allWords }: RoundSummaryProps) {
  const [showMissed, setShowMissed] = useState(false);

  const won = score >= winTarget;
  const missed = [...allWords.entries()]
    .filter(([w]) => !foundWords.has(w))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  let maxScore = 0;
  for (const pts of allWords.values()) maxScore += pts;

  return (
    <div className="round-summary">
      <div className={`result-banner ${won ? 'result-win' : 'result-lose'}`}>
        {won ? 'You won!' : "Time's up!"}
      </div>
      <div className="summary-score">
        <span>{score}</span>
        <span className="summary-target"> / {winTarget} target</span>
      </div>
      <div className="summary-meta">
        Best possible on this board: <strong>{maxScore}</strong> pts ({allWords.size} words)
      </div>

      <div className="summary-section">
        <button
          type="button"
          className="missed-toggle"
          onClick={() => setShowMissed((v) => !v)}
          disabled={missed.length === 0}
        >
          {showMissed ? 'Hide' : 'Show'} missed words ({missed.length})
        </button>
        {showMissed && missed.length > 0 && (
          <ul className="summary-words summary-words-missed">
            {missed.map(([word, pts]) => (
              <li key={word} className="summary-word-item">
                <span>{word}</span>
                <span className="found-word-pts">{pts}pt</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
