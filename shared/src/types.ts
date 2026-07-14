export type RoomPhase =
  | "lobby"
  | "writing"
  | "throwing"
  | "picking"
  | "passing"
  | "revealed";

export interface Chit {
  id: string;
  text: string;
  ownerId: string | null;
}

export interface PublicPlayer {
  id: string;
  nickname: string;
  seat: number;
  connected: boolean;
  hasSubmittedChits: boolean;
  hasPicked: boolean;
  handCount: number;
  /** Own hand texts only for the viewing player; others see empty */
  hand: Chit[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  gifId: string;
  at: number;
}

export interface PublicRoom {
  code: string;
  phase: RoomPhase;
  hostId: string;
  throwerId: string;
  players: PublicPlayer[];
  /** Pool chits: text hidden until picking starts; during picking text may be shown face-down style via id only or shuffled face */
  pool: Chit[];
  currentTurnPlayerId: string | null;
  winnerId: string | null;
  winnerChits: Chit[] | null;
  youPlayerId: string;
  minPlayers: number;
  maxPlayers: number;
}

export interface RoomErrorPayload {
  message: string;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;
export const CHITS_PER_PLAYER = 4;

export function normalizeChitText(text: string): string {
  return text.trim().toLowerCase();
}

/** Nickname uniqueness is case-insensitive. */
export function normalizeNickname(nickname: string): string {
  return nickname.trim().slice(0, 24);
}

export function nicknamesEqual(a: string, b: string): boolean {
  return normalizeNickname(a).toLowerCase() === normalizeNickname(b).toLowerCase();
}

export function chitsMatch(a: string, b: string): boolean {
  return normalizeChitText(a) === normalizeChitText(b);
}

export function hasFourOfAKind(hand: Chit[]): boolean {
  if (hand.length !== CHITS_PER_PLAYER) return false;
  const first = normalizeChitText(hand[0].text);
  return hand.every((c) => normalizeChitText(c.text) === first);
}
