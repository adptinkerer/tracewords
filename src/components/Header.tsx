interface HeaderProps {
  timeLeft: number;
  score: number;
}

export function Header({ timeLeft, score }: HeaderProps) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formatted = `${mins}:${String(secs).padStart(2, '0')}`;
  const urgent = timeLeft <= 15 && timeLeft > 0;

  return (
    <header className="header">
      <span className={`timer${urgent ? ' timer-urgent' : ''}`}>{formatted}</span>
      <span className="score">Score: {score}</span>
    </header>
  );
}
