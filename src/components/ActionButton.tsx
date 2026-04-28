import type { GamePhase } from '../types';

interface ActionButtonProps {
  phase: GamePhase;
  onStart: () => void;
  onNewRound: () => void;
  onGiveUp: () => void;
}

export function ActionButton({ phase, onStart, onNewRound, onGiveUp }: ActionButtonProps) {
  if (phase === 'idle') {
    return <button className="action-btn" onClick={onStart}>Start Round</button>;
  }
  if (phase === 'playing') {
    return (
      <button className="action-btn action-btn-secondary" onClick={onGiveUp}>
        Give Up
      </button>
    );
  }
  return <button className="action-btn" onClick={onNewRound}>New Round</button>;
}
