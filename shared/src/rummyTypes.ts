export type RummyPhase = "lobby" | "playing" | "won";
export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export interface RummyCardEvent {
  kind: "draw-deck" | "draw-discard" | "discard";
  playerId: string;
  cardId: string;
  suit: Suit;
  rank: number;
}

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
  lastCardEvent: RummyCardEvent | null;
}

import { RUMMY_MIN_PLAYERS, ROOM_MAX_PLAYERS } from "./limits";

export const RUMMY_MIN = RUMMY_MIN_PLAYERS;
export const RUMMY_MAX = ROOM_MAX_PLAYERS;

export const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export function cardRankLabel(rank: number): string {
  const ranks: Record<number, string> = {
    1: "A",
    11: "J",
    12: "Q",
    13: "K",
  };
  return ranks[rank] ?? String(rank);
}

export function cardLabel(card: Card): string {
  return `${cardRankLabel(card.rank)}${SUIT_SYMBOL[card.suit]}`;
}

export function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}
