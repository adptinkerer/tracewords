import type { Tile as TileType } from '../types';
import { Tile } from './Tile';

interface GridProps {
  tiles: TileType[];
  path: number[];
  active: boolean;
  hideLetters: boolean;
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

// For mousedown/touchstart we want the full tile area (don't make the user aim).
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
  onDragStart,
  onDragEnter,
  onDragEnd,
  onCancelDrag,
}: GridProps) {
  const pathSet = new Set(path);
  const pathHead = path.length > 0 ? path[path.length - 1] : -1;

  function handleMouseDown(e: React.MouseEvent) {
    if (!active) return;
    e.preventDefault();
    const idx = tileIndexAtPointFull(e.clientX, e.clientY);
    if (idx !== null) onDragStart(idx);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!active) return;
    const idx = tileIndexAtPoint(e.clientX, e.clientY);
    if (idx !== null) onDragEnter(idx);
  }

  function handleMouseUp() {
    if (!active) return;
    onDragEnd();
  }

  function handleMouseLeave() {
    if (!active) return;
    onCancelDrag();
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (!active) return;
    e.preventDefault();
    const touch = e.touches[0];
    const idx = tileIndexAtPointFull(touch.clientX, touch.clientY);
    if (idx !== null) onDragStart(idx);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!active) return;
    e.preventDefault();
    const touch = e.touches[0];
    const idx = tileIndexAtPoint(touch.clientX, touch.clientY);
    if (idx !== null) onDragEnter(idx);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!active) return;
    e.preventDefault();
    onDragEnd();
  }

  return (
    <div
      className="grid"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
