import { useMemo } from 'react';
import './App.css';
import { useDictionary } from './hooks/useDictionary';
import { useGame } from './hooks/useGame';
import { useSortMode } from './hooks/useSortMode';
import { pathToWord } from './utils/wordBuilder';
import { solveBoard } from './utils/solver';
import { Header } from './components/Header';
import { CurrentWord } from './components/CurrentWord';
import { Grid } from './components/Grid';
import { FoundWords } from './components/FoundWords';
import { ActionButton } from './components/ActionButton';
import { RoundSummary } from './components/RoundSummary';

export default function App() {
  const dict = useDictionary();
  const { state, startRound, newRound, giveUp, onDragStart, onDragEnter, onDragEnd, onCancelDrag } =
    useGame(dict);
  const [sortMode, setSortMode] = useSortMode();

  const { display } = pathToWord(state.path, state.tiles);

  // Compute every possible word on the board only when the round ends.
  // Memoized on (phase, tiles) so the DFS runs once per ended round.
  const allWords = useMemo(() => {
    if (state.phase !== 'ended') return new Map<string, number>();
    return solveBoard(state.tiles, dict);
  }, [state.phase, state.tiles, dict]);

  return (
    <div className="app">
      <Header timeLeft={state.timeLeft} score={state.score} />

      <CurrentWord display={display} flash={state.flash} />

      {state.phase === 'ended' ? (
        <RoundSummary
          score={state.score}
          foundWords={state.foundWords}
          allWords={allWords}
        />
      ) : (
        <div className="play-area">
          <Grid
            tiles={state.tiles}
            path={state.path}
            active={state.phase === 'playing'}
            hideLetters={state.phase === 'idle'}
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
            onCancelDrag={onCancelDrag}
          />
          <FoundWords foundWords={state.foundWords} sortMode={sortMode} onSortChange={setSortMode} />
        </div>
      )}

      <ActionButton
        phase={state.phase}
        onStart={startRound}
        onNewRound={newRound}
        onGiveUp={giveUp}
      />

      {state.phase === 'idle' && (
        <p className="instructions">Drag through adjacent letters to form words. Minimum 3 letters.</p>
      )}
    </div>
  );
}
