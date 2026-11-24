import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Draws a line through the centers of the tiles in `path`, over the board.
 * Place it as a sibling of the Grid inside a position:relative wrapper.
 * Uses offsetLeft/Top so tile animations (transforms) don't skew the line.
 */
export function TraceLine({ path, tone }: { path: number[]; tone: 'play' | 'reveal' }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [centers, setCenters] = useState<Record<number, [number, number]>>({});

  useLayoutEffect(() => {
    const board = svgRef.current?.parentElement;
    if (!board) return;
    const measure = () => {
      const next: Record<number, [number, number]> = {};
      board.querySelectorAll<HTMLElement>('[data-tile-index]').forEach((n) => {
        next[Number(n.dataset.tileIndex)] = [n.offsetLeft + n.offsetWidth / 2, n.offsetTop + n.offsetHeight / 2];
      });
      setCenters(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    return () => ro.disconnect();
  }, []);

  const pts = path.map((i) => centers[i]).filter(Boolean);
  const head = pts[pts.length - 1];
  return (
    <svg ref={svgRef} className={`c-trace c-trace-${tone}`} aria-hidden="true">
      {pts.length > 1 && <polyline points={pts.map((p) => p.join(',')).join(' ')} />}
      {pts.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k === pts.length - 1 ? 9 : 6} />)}
      {head && <circle className="c-trace-head" cx={head[0]} cy={head[1]} r={16} />}
    </svg>
  );
}
