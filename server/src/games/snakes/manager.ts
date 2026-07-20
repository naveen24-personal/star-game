import {
  LADDERS,
  SNAKES,
  SNAKES_MAX,
  SNAKES_MIN,
  SNAKES_WIN,
  normalizeNickname,
  nicknamesEqual,
} from "@chit/shared";
import { getBinding, newId, setBinding, uniqueRoomCode } from "../../platform/common";

export interface SnakesPlayer {
  id: string;
  socketId: string;
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
  final: number;
  kind: "normal" | "snake" | "ladder";
}

export interface InternalSnakesRoom {
  code: string;
  phase: "lobby" | "playing" | "won";
  hostId: string;
  players: SnakesPlayer[];
  currentTurnPlayerId: string | null;
  lastRoll: SnakesRollEvent | null;
  winnerId: string | null;
}

const rooms = new Map<string, InternalSnakesRoom>();

function isNicknameTaken(room: InternalSnakesRoom, nickname: string): boolean {
  return room.players.some((p) => p.connected && nicknamesEqual(p.nickname, nickname));
}

function connectedPlayers(room: InternalSnakesRoom): SnakesPlayer[] {
  return room.players.filter((p) => p.connected).sort((a, b) => a.seat - b.seat);
}

function applySnakesLadders(pos: number): { final: number; kind: "normal" | "snake" | "ladder" } {
  if (LADDERS[pos]) return { final: LADDERS[pos], kind: "ladder" };
  if (SNAKES[pos]) return { final: SNAKES[pos], kind: "snake" };
  return { final: pos, kind: "normal" };
}

export function createRoom(
  socketId: string,
  nickname: string
): { ok: true; room: InternalSnakesRoom; playerId: string } | { ok: false; message: string } {
  const name = normalizeNickname(nickname);
  if (!name) return { ok: false, message: "Nickname is required." };

  const code = uniqueRoomCode();
  const playerId = newId();
  const room: InternalSnakesRoom = {
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
        position: 0,
        lastRoll: null,
      },
    ],
    currentTurnPlayerId: null,
    lastRoll: null,
    winnerId: null,
  };
  rooms.set(code, room);
  setBinding(socketId, { roomCode: code, playerId, gameId: "snakes" });
  return { ok: true, room, playerId };
}

export function joinRoom(
  socketId: string,
  code: string,
  nickname: string
): { ok: true; room: InternalSnakesRoom; playerId: string } | { ok: false; message: string } {
  const room = rooms.get(code.trim().toUpperCase());
  if (!room) return { ok: false, message: "Room not found." };
  if (room.phase !== "lobby") return { ok: false, message: "Game already started." };
  if (connectedPlayers(room).length >= SNAKES_MAX) return { ok: false, message: "Room is full." };

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
    position: 0,
    lastRoll: null,
  });
  setBinding(socketId, { roomCode: room.code, playerId, gameId: "snakes" });
  return { ok: true, room, playerId };
}

export function startGame(
  socketId: string
): { ok: true; room: InternalSnakesRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const { room, playerId } = ctx;
  if (playerId !== room.hostId) return { ok: false, message: "Only host can start." };
  if (room.phase !== "lobby") return { ok: false, message: "Already started." };
  const active = connectedPlayers(room);
  if (active.length < SNAKES_MIN || active.length > SNAKES_MAX) {
    return { ok: false, message: `Need ${SNAKES_MIN}–${SNAKES_MAX} players.` };
  }

  room.phase = "playing";
  room.winnerId = null;
  room.lastRoll = null;
  for (const p of active) {
    p.position = 0;
    p.lastRoll = null;
  }
  room.currentTurnPlayerId = active[0].id;
  return { ok: true, room };
}

export function rollDice(
  socketId: string
): { ok: true; room: InternalSnakesRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const { room, playerId } = ctx;
  if (room.phase !== "playing") return { ok: false, message: "Game not in progress." };
  if (room.currentTurnPlayerId !== playerId) return { ok: false, message: "Not your turn." };

  const player = room.players.find((p) => p.id === playerId)!;
  const value = Math.floor(Math.random() * 6) + 1;
  const from = player.position;
  let to = from + value;

  if (to > SNAKES_WIN) {
    to = from;
  } else {
    const applied = applySnakesLadders(to);
    player.position = applied.final;
    player.lastRoll = value;
    room.lastRoll = {
      playerId,
      value,
      from,
      to,
      final: applied.final,
      kind: applied.kind,
    };

    if (player.position === SNAKES_WIN) {
      room.phase = "won";
      room.winnerId = playerId;
      return { ok: true, room };
    }

    const order = connectedPlayers(room);
    const idx = order.findIndex((p) => p.id === playerId);
    room.currentTurnPlayerId = order[(idx + 1) % order.length].id;
    return { ok: true, room };
  }

  player.lastRoll = value;
  room.lastRoll = {
    playerId,
    value,
    from,
    to: from,
    final: from,
    kind: "normal",
  };
  const order = connectedPlayers(room);
  const idx = order.findIndex((p) => p.id === playerId);
  room.currentTurnPlayerId = order[(idx + 1) % order.length].id;
  return { ok: true, room };
}

export function playAgain(
  socketId: string
): { ok: true; room: InternalSnakesRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  if (ctx.playerId !== ctx.room.hostId) {
    return { ok: false, message: "Only host can play again." };
  }
  ctx.room.phase = "lobby";
  ctx.room.currentTurnPlayerId = null;
  ctx.room.lastRoll = null;
  ctx.room.winnerId = null;
  for (const p of ctx.room.players) {
    p.position = 0;
    p.lastRoll = null;
  }
  return { ok: true, room: ctx.room };
}

export function disconnectPlayer(
  roomCode: string,
  playerId: string
): InternalSnakesRoom | null {
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
  if (room.currentTurnPlayerId === playerId && room.phase === "playing") {
    const next = connectedPlayers(room)[0];
    if (next) room.currentTurnPlayerId = next.id;
  }
  return room;
}

export function getRoom(code: string): InternalSnakesRoom | undefined {
  return rooms.get(code);
}

function requirePlayer(socketId: string) {
  const binding = getBinding(socketId);
  if (!binding || binding.gameId !== "snakes") {
    return { ok: false as const, message: "Not in a snakes room." };
  }
  const room = rooms.get(binding.roomCode);
  if (!room) return { ok: false as const, message: "Room not found." };
  return { ok: true as const, room, playerId: binding.playerId };
}

export function toPublicRoom(room: InternalSnakesRoom, viewerId: string) {
  return {
    gameId: "snakes" as const,
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
        position: p.position,
        lastRoll: p.lastRoll,
      })),
    currentTurnPlayerId: room.currentTurnPlayerId,
    lastRoll: room.lastRoll ? { ...room.lastRoll } : null,
    winnerId: room.winnerId,
    youPlayerId: viewerId,
    minPlayers: SNAKES_MIN,
    maxPlayers: SNAKES_MAX,
  };
}

export function listViewerSocketIds(room: InternalSnakesRoom) {
  return room.players
    .filter((p) => p.connected)
    .map((p) => ({ socketId: p.socketId, playerId: p.id }));
}

export function getPlayerForChat(room: InternalSnakesRoom, playerId: string) {
  return room.players.find((p) => p.id === playerId);
}
