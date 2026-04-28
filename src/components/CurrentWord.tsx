import type { FlashKind } from '../types';

interface CurrentWordProps {
  display: string;
  flash: FlashKind;
}

const FLASH_LABELS: Record<NonNullable<FlashKind>, string> = {
  valid: 'Found!',
  invalid: 'Not a word',
  duplicate: 'Already found',
};

export function CurrentWord({ display, flash }: CurrentWordProps) {
  const flashClass = flash ? ` flash-${flash}` : '';
  const label = flash ? FLASH_LABELS[flash] : null;

  return (
    <div className={`current-word${flashClass}`}>
      <span className="current-word-text">{display || '—'}</span>
      {label && <span className="flash-label">{label}</span>}
    </div>
  );
}
