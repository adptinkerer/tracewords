import type { Tile as TileType } from '../types';

interface TileProps {
  tile: TileType;
  isInPath: boolean;
  isPathHead: boolean;
  hidden: boolean;
}

export function Tile({ tile, isInPath, isPathHead, hidden }: TileProps) {
  const label = tile.face === 'qu' ? 'Qu' : tile.face.toUpperCase();
  let cls = 'tile';
  if (hidden) cls += ' tile-hidden';
  if (isPathHead) cls += ' tile-head';
  else if (isInPath) cls += ' tile-in-path';

  return (
    <div className={cls} data-tile-index={tile.id}>
      {hidden ? '' : label}
    </div>
  );
}
