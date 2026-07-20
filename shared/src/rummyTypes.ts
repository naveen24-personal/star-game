export type RummyPhase = "lobby" | "playing" | "won";
export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export interface Card {
  id: string;
  suit: Suit;
  /** 1 = Ace, 11 = J, 12 = Q, 13 = K */
  rank: number;
}

export interface PublicRummyPlayer {
  id: string;
  nickname: string;
  seat: number;
  connected: boolean;
  handCount: number;
  hand: Card[];
}

export interface PublicRummyRoom {
  gameId: "rummy";
  code: string;
  phase: RummyPhase;
  hostId: string;
  players: PublicRummyPlayer[];
  currentTurnPlayerId: string | null;
  deckCount: number;
  discardTop: Card | null;
  winnerId: string | null;
  youPlayerId: string;
  minPlayers: number;
  maxPlayers: number;
  /** Viewer drew a card this turn and must discard */
  mustDiscard: boolean;
}

export const RUMMY_MIN = 2;
export const RUMMY_MAX = 4;

export const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export function cardLabel(card: Card): string {
  const ranks: Record<number, string> = {
    1: "A",
    11: "J",
    12: "Q",
    13: "K",
  };
  const r = ranks[card.rank] ?? String(card.rank);
  return `${r}${SUIT_SYMBOL[card.suit]}`;
}

export function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}
