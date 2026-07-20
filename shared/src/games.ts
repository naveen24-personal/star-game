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
    minPlayers: 3,
    maxPlayers: 8,
    themeClass: "theme-chit",
  },
  bingo: {
    id: "bingo",
    name: "Bingo Hall",
    tagline: "Neon lights, lucky numbers — first line wins the hall.",
    emoji: "🎱",
    minPlayers: 2,
    maxPlayers: 8,
    themeClass: "theme-bingo",
  },
  rummy: {
    id: "rummy",
    name: "Royal Rummy",
    tagline: "Draw, discard, declare — green felt and golden wins.",
    emoji: "♠️",
    minPlayers: 2,
    maxPlayers: 4,
    themeClass: "theme-rummy",
  },
  snakes: {
    id: "snakes",
    name: "Snakes & Ladders",
    tagline: "Roll the dice, climb ladders, dodge snakes to 100.",
    emoji: "🐍",
    minPlayers: 2,
    maxPlayers: 8,
    themeClass: "theme-snakes",
  },
};

export const GAME_IDS = Object.keys(GAME_CATALOG) as GameId[];

export function isGameId(value: string): value is GameId {
  return value in GAME_CATALOG;
}
