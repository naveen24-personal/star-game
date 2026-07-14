import type { PublicPlayer, PublicRoom } from "@chit/shared";

/** Seat "you" at the bottom; others clockwise around the table. */
export function seatsForViewer(room: PublicRoom): PublicPlayer[] {
  const sorted = [...room.players].sort((a, b) => a.seat - b.seat);
  const myIdx = sorted.findIndex((p) => p.id === room.youPlayerId);
  if (myIdx <= 0) return sorted;
  return [...sorted.slice(myIdx), ...sorted.slice(0, myIdx)];
}

/** Position as % of the table arena. Index 0 = bottom (you). */
export function seatPosition(
  index: number,
  total: number
): { left: number; top: number } {
  const n = Math.max(total, 1);
  const angle = Math.PI / 2 + (index * 2 * Math.PI) / n;
  // Keep seats outside the wood so the center stays clear for thrown chits
  const radius = n <= 3 ? 46 : n <= 5 ? 47 : 48;
  return {
    left: 50 + radius * Math.cos(angle),
    top: 50 + radius * Math.sin(angle),
  };
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

/** Stable scatter on the table (looks random, stays put across re-renders). */
export function scatterStyle(id: string, index: number, total: number): {
  left: string;
  top: string;
  transform: string;
  animationDelay: string;
} {
  const h = hashId(id);
  // Spiral-ish base so 20+ chits don't all stack in one corner
  const ring = 0.18 + (index % 5) * 0.07;
  const baseAngle = (index / Math.max(total, 1)) * Math.PI * 2 + ((h % 100) / 100) * 0.8;
  const jitterR = ((h >> 3) % 12) / 100;
  const r = ring + jitterR;
  const cx = 50 + r * 100 * Math.cos(baseAngle) * 0.42;
  const cy = 50 + r * 100 * Math.sin(baseAngle) * 0.38;
  const left = Math.min(88, Math.max(8, cx + (((h >> 9) % 11) - 5)));
  const top = Math.min(86, Math.max(10, cy + (((h >> 14) % 11) - 5)));
  const rot = ((h >> 18) % 70) - 35;
  return {
    left: `${left}%`,
    top: `${top}%`,
    transform: `translate(-50%, -50%) rotate(${rot}deg)`,
    animationDelay: `${Math.min(index * 35, 900)}ms`,
  };
}
