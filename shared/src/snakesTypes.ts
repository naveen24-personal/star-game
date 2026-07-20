export type SnakesPhase = "lobby" | "playing" | "won";

export interface PublicSnakesPlayer {
  id: string;
  nickname: string;
  seat: number;
  connected: boolean;
  position: number;
  lastRoll: number | null;
}

export interface SnakesRollEvent {
  playerId: string;
  value: number;
  from: number;
  to: number;
  /** Applied after landing (snake down or ladder up) */
  final: number;
  kind: "normal" | "snake" | "ladder";
}

export interface PublicSnakesRoom {
  gameId: "snakes";
  code: string;
  phase: SnakesPhase;
  hostId: string;
  players: PublicSnakesPlayer[];
  currentTurnPlayerId: string | null;
  lastRoll: SnakesRollEvent | null;
  winnerId: string | null;
  youPlayerId: string;
  minPlayers: number;
  maxPlayers: number;
}

import { SNAKES_MIN_PLAYERS, ROOM_MAX_PLAYERS } from "./limits";

export const SNAKES_MIN = SNAKES_MIN_PLAYERS;
export const SNAKES_MAX = ROOM_MAX_PLAYERS;
export const SNAKES_WIN = 100;

/** Classic board shortcuts */
export const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

export const SNAKES: Record<number, number> = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};
