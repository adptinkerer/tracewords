import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { useDictionary } from './hooks/useDictionary';
import { useGame } from './hooks/useGame';
import { useSortMode } from './hooks/useSortMode';
import { pathToWord } from './utils/wordBuilder';
import { solveBoard } from './utils/solver';
import { WIN_PERCENT } from './constants';
import { Header } from './components/Header';
import { CurrentWord } from './components/CurrentWord';
import { TypingInput } from './components/TypingInput';
import { Grid } from './components/Grid';
import { FoundWords } from './components/FoundWords';
import { RecentWords } from './components/RecentWords';
import { WordsModal } from './components/WordsModal';
import { ActionButton } from './components/ActionButton';
import { RoundSummary } from './components/RoundSummary';

export default function App() {
  const dict = useDictionary();
  const {
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
  } = useGame(dict);
  const [sortMode, setSortMode] = useSortMode();
  const [wordsModalOpen, setWordsModalOpen] = useState(false);

  const { display } = pathToWord(state.path, state.tiles);

  // Run the solver once per board (after dictionary is loaded). Used both for
  // computing the dynamic win target and the round-end summary. ~100ms.
  const allWords = useMemo(() => {
    if (dict.size === 0) return new Map<string, number>();
    return solveBoard(state.tiles, dict);
  }, [state.tiles, dict]);

  const maxScore = useMemo(() => {
    let s = 0;
    for (const v of allWords.values()) s += v;
    return s;
  }, [allWords]);

  const winTarget = maxScore > 0 ? Math.max(1, Math.ceil(maxScore * WIN_PERCENT / 100)) : 0;

  const ended = state.phase === 'ended';
  const playing = state.phase === 'playing';
  const idle = state.phase === 'idle';

  // While actively playing on mobile, fully lock the page (touch-action: none,
  // overflow: hidden, position: fixed). The CSS rule keys off body.is-playing.
  useEffect(() => {
    if (playing) document.body.classList.add('is-playing');
    else document.body.classList.remove('is-playing');
    return () => document.body.classList.remove('is-playing');
  }, [playing]);

  return (
    <div className="app">
      <Header
        timeLeft={state.timeLeft}
        score={state.score}
        winTarget={winTarget}
        showTarget={!idle && winTarget > 0}
      />

      <CurrentWord display={display} flash={state.flash} />

      {playing && (
        <TypingInput
          active={playing}
          tiles={state.tiles}
          setPath={setPath}
          submitTypedWord={submitTypedWord}
        />
      )}

      <div className="play-area">
        <Grid
          tiles={state.tiles}
          path={state.path}
          active={playing}
          hideLetters={idle}
          greyed={ended}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDragEnd={onDragEnd}
          onCancelDrag={onCancelDrag}
        />
        {/* Desktop sidebar — hidden on mobile via CSS */}
        <div className="found-words-sidebar">
          <FoundWords
            foundWords={state.foundWords}
            sortMode={sortMode}
            onSortChange={setSortMode}
          />
        </div>
      </div>

      {/* Mobile compact strip — hidden on desktop via CSS */}
      <div className="recent-words-mobile">
        <RecentWords
          foundWords={state.foundWords}
          onViewAll={() => setWordsModalOpen(true)}
        />
      </div>

      {ended && (
        <RoundSummary
          score={state.score}
          winTarget={winTarget}
          foundWords={state.foundWords}
          allWords={allWords}
        />
      )}

      <ActionButton
        phase={state.phase}
        onStart={startRound}
        onNewRound={newRound}
        onGiveUp={giveUp}
      />

      {idle && (
        <p className="instructions">
          Drag through adjacent letters or type a word to score. Min 3 letters.
        </p>
      )}

      <WordsModal
        open={wordsModalOpen}
        foundWords={state.foundWords}
        sortMode={sortMode}
        onSortChange={setSortMode}
        onClose={() => setWordsModalOpen(false)}
      />
    </div>
  );
}
