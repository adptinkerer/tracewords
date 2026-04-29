import type { Tile as TileType } from '../types';
import { Tile } from './Tile';

interface GridProps {
  tiles: TileType[];
  path: number[];
  active: boolean;
  hideLetters: boolean;
  greyed: boolean;
  onDragStart: (idx: number) => void;
  onDragEnter: (idx: number) => void;
  onDragEnd: () => void;
  onCancelDrag: () => void;
}

// Pointer must be within INNER_HIT_FRACTION of tile width from center.
// 0.5 = full tile (edges); 0.30 = inner ~60% region (wider dead zone around the rim).
const INNER_HIT_FRACTION = 0.30;

function tileIndexAtPoint(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const node = (el as HTMLElement).closest('[data-tile-index]') as HTMLElement | null;
  if (!node) return null;

  // Inner hit-zone: ignore pointer in the rim/corner of the tile to prevent
  // diagonal drags from clipping off-path neighbors.
  const r = node.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  if (dx > r.width * INNER_HIT_FRACTION || dy > r.height * INNER_HIT_FRACTION) {
    return null;
  }

  const raw = node.dataset.tileIndex;
  if (raw === undefined) return null;
  return parseInt(raw, 10);
}

function tileIndexAtPointFull(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const node = (el as HTMLElement).closest('[data-tile-index]') as HTMLElement | null;
  if (!node) return null;
  const raw = node.dataset.tileIndex;
  if (raw === undefined) return null;
  return parseInt(raw, 10);
}

export function Grid({
  tiles,
  path,
  active,
  hideLetters,
  greyed,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onCancelDrag,
}: GridProps) {
  const pathSet = new Set(path);
  const pathHead = path.length > 0 ? path[path.length - 1] : -1;

  // Pointer Events unify mouse + touch + pen. Combined with `touch-action: none`
  // on the grid (CSS) and setPointerCapture on the element, the browser will
  // not scroll/zoom in response to drags that start on the grid. This is the
  // modern, reliable replacement for mouse+touch event juggling.

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!active) return;
    e.preventDefault();
    // Capture the pointer so that subsequent pointermove/up events fire on
    // this element even if the finger drifts outside it. Without capture,
    // the browser treats finger-leaving-element as a normal scroll gesture.
    e.currentTarget.setPointerCapture(e.pointerId);
    const idx = tileIndexAtPointFull(e.clientX, e.clientY);
    if (idx !== null) onDragStart(idx);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!active) return;
    // Ignore moves when not in an active drag (e.g., mouse hover w/o press).
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const idx = tileIndexAtPoint(e.clientX, e.clientY);
    if (idx !== null) onDragEnter(idx);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!active) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onDragEnd();
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    if (!active) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onCancelDrag();
  }

  return (
    <div
      className={`grid${greyed ? ' grid-greyed' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {tiles.map((tile) => (
        <Tile
          key={tile.id}
          tile={tile}
          isInPath={pathSet.has(tile.id)}
          isPathHead={tile.id === pathHead}
          hidden={hideLetters}
        />
      ))}
    </div>
  );
}
