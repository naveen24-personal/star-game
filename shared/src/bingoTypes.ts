export type BingoPhase = "lobby" | "playing" | "won";

export interface BingoCell {
  /** null = free space */
  number: number | null;
  marked: boolean;
}

export interface PublicBingoPlayer {
  id: string;
  nickname: string;
  seat: number;
  connected: boolean;
}

export interface PublicBingoRoom {
  gameId: "bingo";
  code: string;
  phase: BingoPhase;
  hostId: string;
  players: PublicBingoPlayer[];
  /** Viewer's 5×5 board (null in lobby before start) */
  yourBoard: BingoCell[][] | null;
  calledNumbers: number[];
  currentCall: number | null;
  winnerId: string | null;
  youPlayerId: string;
  minPlayers: number;
  maxPlayers: number;
}

export const BINGO_MIN = 2;
export const BINGO_MAX = 8;

/** B:1-15, I:16-30, N:31-45, G:46-60, O:61-75 */
export const BINGO_COLUMNS: { letter: string; min: number; max: number }[] = [
  { letter: "B", min: 1, max: 15 },
  { letter: "I", min: 16, max: 30 },
  { letter: "N", min: 31, max: 45 },
  { letter: "G", min: 46, max: 60 },
  { letter: "O", min: 61, max: 75 },
];
