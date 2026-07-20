import {
  BINGO_COLUMNS,
  BINGO_MAX,
  BINGO_MIN,
  BingoCell,
  normalizeNickname,
  nicknamesEqual,
} from "@chit/shared";
import { newId, setBinding, shuffle, uniqueRoomCode, getBinding } from "../platform/common";

export interface BingoPlayer {
  id: string;
  socketId: string;
  nickname: string;
  seat: number;
  connected: boolean;
  board: BingoCell[][] | null;
}

export interface InternalBingoRoom {
  code: string;
  phase: "lobby" | "playing" | "won";
  hostId: string;
  players: BingoPlayer[];
  calledNumbers: number[];
  currentCall: number | null;
  winnerId: string | null;
  remaining: number[];
}

const rooms = new Map<string, InternalBingoRoom>();

function isNicknameTaken(room: InternalBingoRoom, nickname: string): boolean {
  return room.players.some((p) => p.connected && nicknamesEqual(p.nickname, nickname));
}

function connectedCount(room: InternalBingoRoom): number {
  return room.players.filter((p) => p.connected).length;
}

export function generateBoard(): BingoCell[][] {
  const grid: BingoCell[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => ({ number: 0, marked: false }))
  );

  for (let col = 0; col < 5; col++) {
    const { min, max } = BINGO_COLUMNS[col];
    const nums = shuffle(
      Array.from({ length: max - min + 1 }, (_, i) => min + i)
    ).slice(0, 5);
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) {
        grid[row][col] = { number: null, marked: true };
      } else {
        grid[row][col] = { number: nums[row], marked: false };
      }
    }
  }
  return grid;
}

export function autoMarkBoard(board: BingoCell[][], number: number): void {
  for (const row of board) {
    for (const cell of row) {
      if (cell.number === number) cell.marked = true;
    }
  }
}

export function hasLineBingo(board: BingoCell[][]): boolean {
  for (let r = 0; r < 5; r++) {
    if (board[r].every((c) => c.marked)) return true;
  }
  for (let c = 0; c < 5; c++) {
    if (board.every((row) => row[c].marked)) return true;
  }
  if ([0, 1, 2, 3, 4].every((i) => board[i][i].marked)) return true;
  if ([0, 1, 2, 3, 4].every((i) => board[i][4 - i].marked)) return true;
  return false;
}

export function createRoom(
  socketId: string,
  nickname: string
): { ok: true; room: InternalBingoRoom; playerId: string } | { ok: false; message: string } {
  const name = normalizeNickname(nickname);
  if (!name) return { ok: false, message: "Nickname is required." };

  const code = uniqueRoomCode();
  const playerId = newId();
  const room: InternalBingoRoom = {
    code,
    phase: "lobby",
    hostId: playerId,
    players: [
      {
        id: playerId,
        socketId,
        nickname: name,
        seat: 0,
        connected: true,
        board: null,
      },
    ],
    calledNumbers: [],
    currentCall: null,
    winnerId: null,
    remaining: [],
  };
  rooms.set(code, room);
  setBinding(socketId, { roomCode: code, playerId, gameId: "bingo" });
  return { ok: true, room, playerId };
}

export function joinRoom(
  socketId: string,
  code: string,
  nickname: string
): { ok: true; room: InternalBingoRoom; playerId: string } | { ok: false; message: string } {
  const room = rooms.get(code.trim().toUpperCase());
  if (!room) return { ok: false, message: "Room not found." };
  if (room.phase !== "lobby") return { ok: false, message: "Game already started." };
  if (connectedCount(room) >= BINGO_MAX) return { ok: false, message: "Room is full." };

  const name = normalizeNickname(nickname);
  if (!name) return { ok: false, message: "Nickname is required." };
  if (isNicknameTaken(room, name)) {
    return { ok: false, message: "That name is already taken. Choose another." };
  }

  const playerId = newId();
  const seat = room.players.length ? Math.max(...room.players.map((p) => p.seat)) + 1 : 0;
  room.players.push({
    id: playerId,
    socketId,
    nickname: name,
    seat,
    connected: true,
    board: null,
  });
  setBinding(socketId, { roomCode: room.code, playerId, gameId: "bingo" });
  return { ok: true, room, playerId };
}

export function getRoom(code: string): InternalBingoRoom | undefined {
  return rooms.get(code);
}

export function startGame(
  socketId: string
): { ok: true; room: InternalBingoRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const { room, playerId } = ctx;
  if (playerId !== room.hostId) return { ok: false, message: "Only host can start." };
  if (room.phase !== "lobby") return { ok: false, message: "Already started." };
  const n = connectedCount(room);
  if (n < BINGO_MIN || n > BINGO_MAX) {
    return { ok: false, message: `Need ${BINGO_MIN}–${BINGO_MAX} players.` };
  }

  room.phase = "playing";
  room.calledNumbers = [];
  room.currentCall = null;
  room.winnerId = null;
  room.remaining = shuffle(Array.from({ length: 75 }, (_, i) => i + 1));
  for (const p of room.players) {
    if (p.connected) p.board = generateBoard();
  }
  return { ok: true, room };
}

export function callNext(
  socketId: string
): { ok: true; room: InternalBingoRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const { room, playerId } = ctx;
  if (playerId !== room.hostId) return { ok: false, message: "Only host calls numbers." };
  if (room.phase !== "playing") return { ok: false, message: "Game not in progress." };
  if (room.remaining.length === 0) return { ok: false, message: "All numbers called." };

  const num = room.remaining.pop()!;
  room.calledNumbers.push(num);
  room.currentCall = num;
  for (const p of room.players) {
    if (p.connected && p.board) autoMarkBoard(p.board, num);
  }
  return { ok: true, room };
}

export function claimBingo(
  socketId: string
): { ok: true; room: InternalBingoRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const { room, playerId } = ctx;
  if (room.phase !== "playing") return { ok: false, message: "Game not in progress." };
  const player = room.players.find((p) => p.id === playerId);
  if (!player?.board) return { ok: false, message: "No board." };
  if (!hasLineBingo(player.board)) {
    return { ok: false, message: "No valid line yet — keep playing!" };
  }
  room.phase = "won";
  room.winnerId = playerId;
  return { ok: true, room };
}

export function playAgain(
  socketId: string
): { ok: true; room: InternalBingoRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  if (ctx.playerId !== ctx.room.hostId) {
    return { ok: false, message: "Only host can play again." };
  }
  ctx.room.phase = "lobby";
  ctx.room.calledNumbers = [];
  ctx.room.currentCall = null;
  ctx.room.winnerId = null;
  ctx.room.remaining = [];
  for (const p of ctx.room.players) {
    p.board = null;
  }
  return { ok: true, room: ctx.room };
}

export function disconnectPlayer(
  roomCode: string,
  playerId: string
): InternalBingoRoom | null {
  const room = rooms.get(roomCode);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.connected = false;
  if (room.players.every((p) => !p.connected)) {
    rooms.delete(roomCode);
    return null;
  }
  if (room.hostId === playerId) {
    const next = room.players.find((p) => p.connected);
    if (next) room.hostId = next.id;
  }
  return room;
}

function requirePlayer(socketId: string) {
  const binding = getBinding(socketId);
  if (!binding || binding.gameId !== "bingo") {
    return { ok: false as const, message: "Not in a bingo room." };
  }
  const room = rooms.get(binding.roomCode);
  if (!room) return { ok: false as const, message: "Room not found." };
  return { ok: true as const, room, playerId: binding.playerId };
}

export function toPublicRoom(room: InternalBingoRoom, viewerId: string) {
  const viewer = room.players.find((p) => p.id === viewerId);
  return {
    gameId: "bingo" as const,
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    players: [...room.players]
      .sort((a, b) => a.seat - b.seat)
      .map((p) => ({
        id: p.id,
        nickname: p.nickname,
        seat: p.seat,
        connected: p.connected,
      })),
    yourBoard: viewer?.board ? viewer.board.map((row) => row.map((c) => ({ ...c }))) : null,
    calledNumbers: [...room.calledNumbers],
    currentCall: room.currentCall,
    winnerId: room.winnerId,
    youPlayerId: viewerId,
    minPlayers: BINGO_MIN,
    maxPlayers: BINGO_MAX,
  };
}

export function listViewerSocketIds(room: InternalBingoRoom) {
  return room.players
    .filter((p) => p.connected)
    .map((p) => ({ socketId: p.socketId, playerId: p.id }));
}

export function getPlayerForChat(room: InternalBingoRoom, playerId: string) {
  return room.players.find((p) => p.id === playerId);
}

export function rebindSocket(room: InternalBingoRoom, playerId: string, socketId: string) {
  const p = room.players.find((x) => x.id === playerId);
  if (p) p.socketId = socketId;
}
