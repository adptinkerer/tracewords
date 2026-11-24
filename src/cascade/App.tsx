import { useEffect, useState } from 'react';
import '../App.css';
import './cascade.css';
import { useDictionary } from '../hooks/useDictionary';
import { Grid } from '../components/Grid';
import { TypingInput } from '../components/TypingInput';
import { useCascade } from './useCascade';
import type { CTile } from './types';
import { ITEM_BY_ID } from './items';
import { CascadeTile, GameOver, Hud, Inventory, Shop, Title, WordLog, type Best } from './components';

const BEST_KEY = 'cascade-best';

function loadBest(): Best {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (raw) return JSON.parse(raw) as Best;
  } catch { /* storage unavailable */ }
  return { score: 0, streak: 0, level: 0 };
}

export default function App() {
  const dict = useDictionary();
  const g = useCascade(dict);
  const s = g.state;
  const [best, setBest] = useState<Best>(loadBest);

  const playing = s.phase === 'playing' || s.phase === 'clearing';
  const onBoard = playing;

  // Record personal best when a run ends.
  useEffect(() => {
    if (s.phase !== 'over') return;
    const b = loadBest();
    const next = {
      score: Math.max(b.score, s.score),
      streak: Math.max(b.streak, s.streak),
      level: Math.max(b.level, s.level),
    };
    setBest(next);
    try { localStorage.setItem(BEST_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, [s.phase, s.score, s.streak, s.level]);

  // Same mobile scroll lock as Tracewords during play.
  useEffect(() => {
    if (!playing) return;
    document.body.classList.add('is-playing');
    const onMove = (e: TouchEvent) => {
      if ((e.target as HTMLElement | null)?.closest('.c-log')) return;
      e.preventDefault();
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    return () => {
      document.body.classList.remove('is-playing');
      document.removeEventListener('touchmove', onMove);
    };
  }, [playing]);

  const pathWord = s.path
    .map((i) => s.tiles[i].face)
    .map((f) => (f === 'qu' ? 'Qu' : f === '*' ? '?' : f.toUpperCase()))
    .join('');
  const clearingSet = new Set(s.clearing);

  if (s.phase === 'title') return <div className="app c-app"><Title best={best} onStart={g.startRun} /></div>;

  return (
    <div className="app c-app">
      <Hud s={s} />

      {onBoard && (
        <>
          <div className={`current-word c-current${s.flash ? ` c-flash-${s.flash.kind}` : ''}`}>
            <span className="current-word-text">
              {s.targeting
                ? `Tap a tile to ${s.targeting === 'bomb' ? 'bomb 💣' : 'make blank ❔'}`
                : pathWord || s.flash?.text || ' '}
            </span>
          </div>

          {!s.targeting && (
            <TypingInput
              active={s.phase === 'playing'}
              tiles={s.tiles}
              setPath={g.setPath}
              submitTypedWord={g.submitTypedWord}
            />
          )}

          <div className="play-area">
            <Grid
              tiles={s.tiles}
              path={s.path}
              active={s.phase === 'playing'}
              hideLetters={false}
              greyed={false}
              className={s.targeting ? `c-grid-target-${s.targeting}` : undefined}
              onDragStart={g.onDragStart}
              onDragEnter={g.onDragEnter}
              onDragEnd={g.onDragEnd}
              onCancelDrag={g.onCancelDrag}
              renderTile={(t, inPath, head) => (
                <CascadeTile
                  key={(t as CTile).uid}
                  tile={t as CTile}
                  inPath={inPath}
                  head={head}
                  popping={clearingSet.has(t.id)}
                  targeting={s.targeting}
                />
              )}
            />
            <div className="c-side">
              <WordLog history={s.history} />
            </div>
          </div>

          <Inventory s={s} onUse={g.applyItem} onEnd={g.endRun} />
          {s.targeting && (
            <p className="c-sub">{ITEM_BY_ID[s.targeting].desc} Tap the item again to cancel.</p>
          )}
        </>
      )}

      {s.phase === 'shop' && (
        <Shop s={s} onBuyItem={g.buyItem} onBuyPerk={g.buyPerk} onNext={g.nextLevel} />
      )}

      {s.phase === 'over' && <GameOver s={s} best={best} onRestart={g.startRun} />}
    </div>
  );
}
