import { useEffect, useRef } from 'react';
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

// Body scroll lock using the position:fixed pattern. The most reliable
// cross-browser way to prevent the page from scrolling during a touch drag.
// We preserve the current scroll position and restore it on release.
function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.dataset.scrollY = String(scrollY);
}

function unlockBodyScroll() {
  const scrollY = parseInt(document.body.dataset.scrollY ?? '0', 10);
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  delete document.body.dataset.scrollY;
  window.scrollTo(0, scrollY);
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
  const gridRef = useRef<HTMLDivElement>(null);

  // Native, non-passive touch listeners. React's onTouchXxx handlers can run
  // as passive: true on some browsers, which silently ignores preventDefault()
  // — letting the page scroll mid-drag. Attaching via addEventListener with
  // explicit { passive: false } guarantees preventDefault works.
  useEffect(() => {
    const el = gridRef.current;
    if (!el || !active) return;

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      lockBodyScroll();
      const t = e.touches[0];
      const idx = tileIndexAtPointFull(t.clientX, t.clientY);
      if (idx !== null) onDragStart(idx);
    };
    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const idx = tileIndexAtPoint(t.clientX, t.clientY);
      if (idx !== null) onDragEnter(idx);
    };
    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      unlockBodyScroll();
      onDragEnd();
    };
    const onCancel = () => {
      unlockBodyScroll();
      onCancelDrag();
    };

    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: false });
    el.addEventListener('touchcancel', onCancel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
      // Safety: if the round ends mid-drag, ensure scroll is unlocked.
      if (document.body.dataset.scrollY !== undefined) unlockBodyScroll();
    };
  }, [active, onDragStart, onDragEnter, onDragEnd, onCancelDrag]);

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

  return (
    <div
      ref={gridRef}
      className={`grid${greyed ? ' grid-greyed' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
