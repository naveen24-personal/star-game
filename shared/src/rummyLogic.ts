import type { Card, RummyCardEvent } from "./rummyTypes";

export const RUMMY_HAND_SIZE = 13;
export const RUMMY_MELD_PATTERN = [4, 3, 3, 3] as const;

export function isValidMeld(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  const ranks = cards.map((c) => c.rank);
  const suits = cards.map((c) => c.suit);
  if (ranks.every((r) => r === ranks[0])) return true;
  if (!suits.every((s) => s === suits[0])) return false;
  const sorted = [...ranks].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) return false;
  }
  return true;
}

function combos<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combos(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combos(rest, k);
  return [...withFirst, ...withoutFirst];
}

function meldsOfSize(cards: Card[], size: number): Card[][] {
  if (cards.length < size) return [];
  return combos(cards, size).filter(isValidMeld);
}

function canPartitionThrees(cards: Card[]): boolean {
  if (cards.length === 0) return true;
  if (cards.length % 3 !== 0) return false;
  if (cards.length === 0) return true;
  const options = meldsOfSize(cards, 3);
  for (const pick of options) {
    const ids = new Set(pick.map((c) => c.id));
    const rest = cards.filter((c) => !ids.has(c.id));
    if (canPartitionThrees(rest)) return true;
  }
  return false;
}

/** Indian rummy: exactly one 4-card meld and three 3-card melds (13 cards). */
export function isValidRummy4333(cards: Card[]): boolean {
  if (cards.length !== RUMMY_HAND_SIZE) return false;
  const fours = meldsOfSize(cards, 4);
  for (const four of fours) {
    const ids = new Set(four.map((c) => c.id));
    const rest = cards.filter((c) => !ids.has(c.id));
    if (rest.length === 9 && canPartitionThrees(rest)) return true;
  }
  return false;
}

/** Validate explicit meld groups (4 + 3 + 3 + 3). */
export function isValidMeldGroups(groups: Card[][]): boolean {
  if (groups.length !== 4) return false;
  const sizes = groups.map((g) => g.length).sort((a, b) => a - b);
  if (sizes.join(",") !== "3,3,3,4") return false;
  return groups.every(isValidMeld);
}

export function allCardsInGroups(hand: Card[], groups: Card[][]): boolean {
  const ids = new Set(hand.map((c) => c.id));
  let n = 0;
  for (const g of groups) {
    for (const c of g) {
      if (!ids.has(c.id)) return false;
      n++;
    }
  }
  return n === hand.length;
}
