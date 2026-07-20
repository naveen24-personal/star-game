/** Serpentine board: row 0 L→R, row 1 R→L, … (cell 1 at bottom-left). */
export function cellNumber(row: number, col: number): number {
  const base = row * 10;
  if (row % 2 === 0) return base + col + 1;
  return base + (10 - col);
}

export function cellPos(n: number): { row: number; col: number } {
  const row = Math.floor((n - 1) / 10);
  const offset = (n - 1) % 10;
  const col = row % 2 === 0 ? offset : 9 - offset;
  return { row, col };
}

/** Center point in 0–100 SVG space (100 at top, 1 at bottom). */
export function getCellCenter(n: number): { x: number; y: number } {
  const { row, col } = cellPos(n);
  const displayRow = 9 - row;
  return { x: (col + 0.5) * 10, y: (displayRow + 0.5) * 10 };
}

export function snakeCurvePath(from: number, to: number): string {
  const a = getCellCenter(from);
  const b = getCellCenter(to);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(18, len * 0.35);
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function ladderRails(from: number, to: number): { x1: number; y1: number; x2: number; y2: number }[] {
  const a = getCellCenter(from);
  const b = getCellCenter(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * 2.2;
  const py = (dx / len) * 2.2;
  return [
    { x1: a.x + px, y1: a.y + py, x2: b.x + px, y2: b.y + py },
    { x1: a.x - px, y1: a.y - py, x2: b.x - px, y2: b.y - py },
  ];
}

export function ladderRungs(from: number, to: number, count = 6): { x1: number; y1: number; x2: number; y2: number }[] {
  const rails = ladderRails(from, to);
  const rungs: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 1; i < count; i++) {
    const t = i / count;
    rungs.push({
      x1: rails[0].x1 + (rails[0].x2 - rails[0].x1) * t,
      y1: rails[0].y1 + (rails[0].y2 - rails[0].y1) * t,
      x2: rails[1].x1 + (rails[1].x2 - rails[1].x1) * t,
      y2: rails[1].y1 + (rails[1].y2 - rails[1].y1) * t,
    });
  }
  return rungs;
}

export const TOKEN_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#a855f7",
  "#f97316",
  "#14b8a6",
  "#ec4899",
  "#eab308",
  "#6366f1",
];
