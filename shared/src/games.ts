import {
  BINGO_MIN_PLAYERS,
  CHIT_MIN_PLAYERS,
  ROOM_MAX_PLAYERS,
  RUMMY_MIN_PLAYERS,
  SNAKES_MIN_PLAYERS,
} from "./limits";

export type GameId = "chit" | "bingo" | "rummy" | "snakes";

export interface GameInfo {
  id: GameId;
  name: string;
  tagline: string;
  emoji: string;
  minPlayers: number;
  maxPlayers: number;
  themeClass: string;
}

export const GAME_CATALOG: Record<GameId, GameInfo> = {
  chit: {
    id: "chit",
    name: "Chit Party",
    tagline: "Write, throw, pick four matching chits — Tollywood table vibes.",
    emoji: "🎴",
    minPlayers: CHIT_MIN_PLAYERS,
    maxPlayers: ROOM_MAX_PLAYERS,
    themeClass: "theme-chit",
  },
  bingo: {
    id: "bingo",
    name: "Bingo Hall",
    tagline: "Neon lights, lucky numbers — first line wins the hall.",
    emoji: "🎱",
    minPlayers: BINGO_MIN_PLAYERS,
    maxPlayers: ROOM_MAX_PLAYERS,
    themeClass: "theme-bingo",
  },
  rummy: {
    id: "rummy",
    name: "Royal Rummy",
    tagline: "13 cards — arrange 4+3+3+3 on the green round table, draw, discard, declare.",
    emoji: "♠️",
    minPlayers: RUMMY_MIN_PLAYERS,
    maxPlayers: ROOM_MAX_PLAYERS,
    themeClass: "theme-rummy",
  },
  snakes: {
    id: "snakes",
    name: "Snakes & Ladders",
    tagline: "Roll the dice, climb ladders, dodge snakes to 100.",
    emoji: "🐍",
    minPlayers: SNAKES_MIN_PLAYERS,
    maxPlayers: ROOM_MAX_PLAYERS,
    themeClass: "theme-snakes",
  },
};

export const GAME_IDS = Object.keys(GAME_CATALOG) as GameId[];

export function isGameId(value: string): value is GameId {
  return value in GAME_CATALOG;
}

export {
  BINGO_MIN_PLAYERS,
  CHIT_MIN_PLAYERS,
  ROOM_MAX_PLAYERS,
  RUMMY_MIN_PLAYERS,
  SNAKES_MIN_PLAYERS,
  isRoomFull,
  roomCapacityMessage,
} from "./limits";
