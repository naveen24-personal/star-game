import type { PublicPlayer, PublicRoom } from "@chit/shared";

/** Seat "you" at the bottom; others clockwise for pass-right logic. */
export function seatsForViewer(room: PublicRoom): PublicPlayer[] {
  const sorted = [...room.players].sort((a, b) => a.seat - b.seat);
  const myIdx = sorted.findIndex((p) => p.id === room.youPlayerId);
  if (myIdx <= 0) return sorted;
  return [...sorted.slice(myIdx), ...sorted.slice(0, myIdx)];
}

export function opponentsForViewer(room: PublicRoom): PublicPlayer[] {
  return seatsForViewer(room).filter((p) => p.id !== room.youPlayerId);
}

/**
 * UNO-style top arc: opponents left → right along the upper edge.
 * Middle seat sits a bit higher; sides a bit lower.
 */
export function opponentPosition(
  index: number,
  totalOpponents: number
): { left: number; top: number } {
  const n = Math.max(totalOpponents, 1);
  if (n === 1) return { left: 50, top: 11 };
  const t = index / (n - 1);
  const left = 11 + t * 78;
  const top = 10 + (1 - Math.sin(Math.PI * t)) * 12;
  return { left, top };
}

/** Full seat map including you at bottom-center (for GIF pops / pass flight). */
export function seatPosition(
  index: number,
  total: number
): { left: number; top: number } {
  // index 0 = you (bottom)
  if (index === 0) return { left: 50, top: 88 };
  const oppCount = Math.max(total - 1, 1);
  return opponentPosition(index - 1, oppCount);
}

export function seatPositionMap(room: PublicRoom): Map<string, { left: number; top: number }> {
  const seats = seatsForViewer(room);
  const map = new Map<string, { left: number; top: number }>();
  seats.forEach((p, i) => {
    map.set(p.id, seatPosition(i, seats.length));
  });
  return map;
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

/** Messy clubbed pile in the center of the table. */
export function scatterStyle(id: string, index: number, total: number): {
  left: string;
  top: string;
  transform: string;
  animationDelay: string;
} {
  const h = hashId(id);
  const ring = 0.08 + (index % 6) * 0.045;
  const baseAngle = (index / Math.max(total, 1)) * Math.PI * 2 + ((h % 100) / 100) * 0.9;
  const jitterR = ((h >> 3) % 10) / 140;
  const r = ring + jitterR;
  const cx = 50 + r * 100 * Math.cos(baseAngle) * 0.55;
  const cy = 48 + r * 100 * Math.sin(baseAngle) * 0.42;
  const left = Math.min(78, Math.max(22, cx + (((h >> 9) % 9) - 4)));
  const top = Math.min(70, Math.max(28, cy + (((h >> 14) % 9) - 4)));
  const rot = ((h >> 18) % 80) - 40;
  return {
    left: `${left}%`,
    top: `${top}%`,
    transform: `translate(-50%, -50%) rotate(${rot}deg)`,
    animationDelay: `${Math.min(index * 28, 800)}ms`,
  };
}
