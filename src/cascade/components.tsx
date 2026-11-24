import type { CTile, ItemId, PerkId, PlayedWord, RevealWord, RunState } from './types';
import { ITEMS, ITEM_BY_ID, PERK_BY_ID } from './items';
import { MAX_PERKS, TIERS, levelTarget, minLength, perkPrice } from './config';
import { tierIndex } from './letters';
import { itemForSale, itemPrice } from './useCascade';

export function CascadeTile({
  tile, inPath, head, popping, targeting,
}: {
  tile: CTile; inPath: boolean; head: boolean; popping: boolean; targeting: 'bomb' | 'wild' | null;
}) {
  const label = tile.face === 'qu' ? 'Qu' : tile.face === '*' ? '?' : tile.face.toUpperCase();
  let cls = 'tile c-tile';
  if (head) cls += ' tile-head';
  else if (inPath) cls += ' tile-in-path';
  if (popping) cls += ' c-pop';
  if (tile.coin) cls += ' c-coin';
  if (tile.mult) cls += ` c-mult-${tile.mult}`;
  if (tile.face === '*') cls += ' c-blank';
  if (targeting) cls += ` c-target-${targeting}`;
  return (
    <div className={cls} data-tile-index={tile.id}>
      <span className="c-letter">{label}</span>
      <span className="c-value">{tile.value}</span>
      {tile.mult && <span className="c-mult">{tile.mult}</span>}
      {tile.coin && <span className="c-coin-dot">🪙</span>}
    </div>
  );
}

export function Hud({ s }: { s: RunState }) {
  const target = levelTarget(s.level);
  const pct = Math.min(100, (s.levelScore / target) * 100);
  const tier = TIERS[tierIndex(s.score, s.perks)];
  return (
    <header className="c-hud">
      <div className="c-hud-row">
        <span className="c-level">Level {s.level}</span>
        <span className="c-stat" title="Total score">⭐ {s.score}</span>
        <span className="c-stat" title="Words in streak">🔥 {s.streak}</span>
        <span className="c-stat" title="Coins">🪙 {s.coins}</span>
      </div>
      <div className="c-progress" aria-label="Level progress">
        <div className="c-progress-fill" style={{ width: `${pct}%` }} />
        <span className="c-progress-text">{s.levelScore} / {target}</span>
      </div>
      <div className="c-hud-row c-hud-meta">
        <span>Min {minLength(s.level)} letters{s.perks.length > 0 && ` · ✨${s.perks.length} perk${s.perks.length > 1 ? 's' : ''}`}</span>
        <span>Letters: <strong className={`c-tier c-tier-${TIERS.indexOf(tier)}`}>{tier.name}</strong></span>
      </div>
    </header>
  );
}

export function Inventory({
  s, onUse, onEnd,
}: { s: RunState; onUse: (id: ItemId) => void; onEnd: () => void }) {
  const owned = ITEMS.filter((it) => s.inventory[it.id] > 0);
  return (
    <div className="c-toolbar">
      <div className="c-items">
        {owned.length === 0 && <span className="c-items-empty">No items. Clear a level to shop.</span>}
        {owned.map((it) => (
          <button
            key={it.id}
            className={`c-item${s.targeting === it.id ? ' c-item-active' : ''}`}
            disabled={s.phase !== 'playing'}
            onClick={() => onUse(it.id)}
            aria-label={`${it.name}: ${it.desc}`}
          >
            <span className="c-item-icon">{it.icon}</span>
            <span className="c-item-name">{it.short}</span>
            {s.inventory[it.id] > 1 && <span className="c-item-count">{s.inventory[it.id]}</span>}
          </button>
        ))}
      </div>
      <button className={`c-end${s.stuck ? ' c-end-urgent' : ''}`} onClick={onEnd}>
        Give up
      </button>
    </div>
  );
}

export function PerkChips({ perks }: { perks: PerkId[] }) {
  if (perks.length === 0) return null;
  return (
    <div className="c-perk-row">
      {perks.map((p) => (
        <span key={p} className="c-perk-chip" title={PERK_BY_ID[p].desc}>{PERK_BY_ID[p].name}</span>
      ))}
    </div>
  );
}

export function Shop({
  s, onBuyItem, onBuyPerk, onNext,
}: {
  s: RunState; onBuyItem: (id: ItemId) => void; onBuyPerk: (id: PerkId) => void; onNext: () => void;
}) {
  const nextMin = minLength(s.level + 1);
  const minUp = nextMin > minLength(s.level);
  const pp = perkPrice(s.level);
  const full = s.perks.length >= MAX_PERKS;
  return (
    <div className="c-panel c-shop">
      <h2>Level {s.level} cleared</h2>
      <p className="c-sub">You have <strong>🪙 {s.coins}</strong></p>

      <h3>Items</h3>
      <div className="c-shop-grid">
        {ITEMS.filter((it) => itemForSale(s, it.id)).map((it) => {
          const cost = itemPrice(s, it.id);
          return (
            <button key={it.id} className="c-shop-card" disabled={s.coins < cost} onClick={() => onBuyItem(it.id)}>
              <span className="c-shop-icon">{it.icon}</span>
              <span className="c-shop-name">{it.name} <em>×{s.inventory[it.id]}</em></span>
              <span className="c-shop-desc">{it.desc}</span>
              <span className="c-shop-price">🪙 {cost}</span>
            </button>
          );
        })}
      </div>

      <h3>Perks <span className="c-sub">({s.perks.length}/{MAX_PERKS})</span></h3>
      <div className="c-shop-grid">
        {s.shopPerks.length === 0 && <p className="c-sub">Sold out.</p>}
        {s.shopPerks.map((id) => (
          <button key={id} className="c-shop-card c-perk-card" disabled={s.coins < pp || full} onClick={() => onBuyPerk(id)}>
            <span className="c-shop-name">{PERK_BY_ID[id].name}</span>
            <span className="c-shop-desc">{PERK_BY_ID[id].desc}</span>
            <span className="c-shop-price">{full ? 'Slots full' : `🪙 ${pp}`}</span>
          </button>
        ))}
      </div>

      <button className="action-btn" onClick={onNext}>
        Level {s.level + 1} → target {levelTarget(s.level + 1)}
      </button>
      {minUp && <p className="c-warn">Heads up: words must be {nextMin}+ letters from here.</p>}
    </div>
  );
}

export function GameOver({ s, best, onRestart }: { s: RunState; best: Best; onRestart: () => void }) {
  const top = s.history.reduce<PlayedWord | null>((b, w) => (!b || w.pts > b.pts ? w : b), null);
  return (
    <div className="c-panel c-over">
      <h2>{s.gaveUp ? 'You gave up' : s.stuck ? 'Stuck!' : 'Run over'}</h2>
      <div className="c-over-stats">
        <div><strong>{s.score}</strong><span>score</span></div>
        <div><strong>{s.streak}</strong><span>words</span></div>
        <div><strong>{s.level}</strong><span>level</span></div>
      </div>
      {s.gaveUp && <LeftOnBoard s={s} />}
      {top && <p className="c-sub">Best word: <strong>{top.word.toUpperCase()}</strong> for {top.pts} ({top.breakdown})</p>}
      <p className="c-sub">Personal best: {best.score} pts · {best.streak} words · level {best.level}</p>
      <button className="action-btn" onClick={onRestart}>New run</button>
    </div>
  );
}

export interface Best { score: number; streak: number; level: number }

export function Title({ best, onStart }: { best: Best; onStart: () => void }) {
  return (
    <div className="c-panel c-title">
      <h1>Cascade</h1>
      <p>Trace words. Used letters pop and new ones fall in. Keep going until there's nothing left to play.</p>
      <ul>
        <li>Letters score their <strong>Scrabble values</strong>. Longer words multiply.</li>
        <li><span className="c-legend c-mult-DL">DL</span> <span className="c-legend c-mult-TL">TL</span> <span className="c-legend c-mult-DW">DW</span> <span className="c-legend c-mult-TW">TW</span> squares boost scores. 🪙 tiles bank coins.</li>
        <li>Hit the level target to visit the <strong>shop</strong>: bombs, vowels, blanks, remixes and perks.</li>
        <li>Letters get harder as your score climbs. Minimum word length rises every 3 levels.</li>
        <li>No repeats. You're out when no word fits and you have no items left.</li>
      </ul>
      {best.score > 0 && <p className="c-sub">Best: {best.score} pts · {best.streak} words · level {best.level}</p>}
      <button className="action-btn" onClick={onStart}>Start run</button>
      <a className="c-link" href="../">← Back to Tracewords</a>
    </div>
  );
}

export function WordLog({ history }: { history: PlayedWord[] }) {
  if (history.length === 0) return <p className="c-sub c-log-empty">Your words will appear here.</p>;
  return (
    <ol className="c-log">
      {history.slice(0, 40).map((w, i) => (
        <li key={`${w.word}-${i}`}>
          <span className="c-log-word">{w.word.toUpperCase()}</span>
          <span className="c-log-break">{w.breakdown}</span>
          <span className="c-log-pts">+{w.pts}{w.coins ? ` 🪙${w.coins}` : ''}</span>
        </li>
      ))}
    </ol>
  );
}

export { ITEM_BY_ID };

function LeftOnBoard({ s }: { s: RunState }) {
  const n = s.remaining.length;
  if (n === 0) return <p className="c-sub">There were no words left on the board.</p>;
  const top = s.remaining.reduce((b, w) => (w.pts > b.pts ? w : b));
  return (
    <p className="c-sub">
      {n} word{n > 1 ? 's were' : ' was'} still on the board. Most valuable: <strong>{top.word.toUpperCase()}</strong> for {top.pts}.
    </p>
  );
}

export function ConfirmGiveUp({
  s, onCancel, onConfirm,
}: { s: RunState; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="c-modal-backdrop" onClick={onCancel}>
      <div
        className="c-modal" role="dialog" aria-modal="true" aria-labelledby="c-giveup-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
      >
        <h2 id="c-giveup-title">Give up this run?</h2>
        <p>
          Your run ends at <strong>{s.score} points</strong> and <strong>{s.streak} words</strong>.
          Then every word still on the board gets traced for you.
        </p>
        <div className="c-modal-actions">
          <button className="c-btn c-btn-ghost" onClick={onCancel} autoFocus>Keep playing</button>
          <button className="c-btn c-btn-danger" onClick={onConfirm}>Give up</button>
        </div>
      </div>
    </div>
  );
}

export function RevealList({ words, revealed }: { words: RevealWord[]; revealed: number }) {
  if (words.length === 0) return <p className="c-sub c-reveal-empty">No words were left on the board.</p>;
  return (
    <ol className="c-reveal-list">
      {words.slice(0, revealed).map((w) => (
        <li key={w.word}><span>{w.word.toUpperCase()}</span> <b>{w.pts}</b></li>
      ))}
    </ol>
  );
}
