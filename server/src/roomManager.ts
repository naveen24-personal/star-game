import {
  ChatMessage,
  Chit,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PublicPlayer,
  PublicRoom,
  TOLLYWOOD_GIF_IDS,
} from "@chit/shared";
import { randomUUID } from "crypto";
import {
  canStart,
  createRoomCode,
  handleDisconnectLogic,
  InternalPlayer,
  InternalRoom,
  passChit,
  pickChits,
  resetToLobby,
  startWriting,
  submitChits,
  throwChits,
} from "./gameLogic";

const rooms = new Map<string, InternalRoom>();
const socketToRoom = new Map<string, { roomCode: string; playerId: string }>();

function uniqueCode(): string {
  for (let i = 0; i < 20; i++) {
    const code = createRoomCode();
    if (!rooms.has(code)) return code;
  }
  return createRoomCode() + createRoomCode().slice(0, 2);
}

export function createRoom(socketId: string, nickname: string): { room: InternalRoom; playerId: string } {
  const code = uniqueCode();
  const playerId = randomUUID();
  const player: InternalPlayer = {
    id: playerId,
    socketId,
    nickname: nickname.trim().slice(0, 24) || "Player",
    seat: 0,
    connected: true,
    submittedTexts: null,
    hand: [],
    hasPicked: false,
  };
  const room: InternalRoom = {
    code,
    phase: "lobby",
    hostId: playerId,
    throwerId: playerId,
    players: [player],
    allChits: [],
    pool: [],
    currentTurnPlayerId: null,
    winnerId: null,
    winnerChits: null,
  };
  rooms.set(code, room);
  socketToRoom.set(socketId, { roomCode: code, playerId });
  return { room, playerId };
}

export function joinRoom(
  socketId: string,
  code: string,
  nickname: string
): { ok: true; room: InternalRoom; playerId: string } | { ok: false; message: string } {
  const room = rooms.get(code.trim().toUpperCase());
  if (!room) return { ok: false, message: "Room not found." };
  if (room.phase !== "lobby") return { ok: false, message: "Game already started." };
  const connected = room.players.filter((p) => p.connected);
  if (connected.length >= MAX_PLAYERS) return { ok: false, message: "Room is full." };

  const playerId = randomUUID();
  const seat = room.players.length
    ? Math.max(...room.players.map((p) => p.seat)) + 1
    : 0;
  room.players.push({
    id: playerId,
    socketId,
    nickname: nickname.trim().slice(0, 24) || "Player",
    seat,
    connected: true,
    submittedTexts: null,
    hand: [],
    hasPicked: false,
  });
  socketToRoom.set(socketId, { roomCode: room.code, playerId });
  return { ok: true, room, playerId };
}

export function getBinding(socketId: string) {
  return socketToRoom.get(socketId);
}

export function getRoom(code: string): InternalRoom | undefined {
  return rooms.get(code);
}

export function startGame(
  socketId: string
): { ok: true; room: InternalRoom } | { ok: false; message: string } {
  const binding = socketToRoom.get(socketId);
  if (!binding) return { ok: false, message: "Not in a room." };
  const room = rooms.get(binding.roomCode);
  if (!room) return { ok: false, message: "Room not found." };
  if (binding.playerId !== room.hostId) return { ok: false, message: "Only host can start." };
  if (!canStart(room)) {
    return {
      ok: false,
      message: `Need ${MIN_PLAYERS}–${MAX_PLAYERS} connected players.`,
    };
  }
  startWriting(room);
  return { ok: true, room };
}

export function doSubmitChits(socketId: string, texts: string[]) {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const result = submitChits(ctx.room, ctx.playerId, texts);
  if (!result.ok) return result;
  return { ok: true as const, room: ctx.room };
}

export function doThrow(socketId: string) {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const result = throwChits(ctx.room, ctx.playerId);
  if (!result.ok) return result;
  return { ok: true as const, room: ctx.room };
}

export function doPick(socketId: string, chitIds: string[]) {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const result = pickChits(ctx.room, ctx.playerId, chitIds);
  if (!result.ok) return result;
  return { ok: true as const, room: ctx.room };
}

export function doPass(socketId: string, chitId: string) {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const result = passChit(ctx.room, ctx.playerId, chitId);
  if (!result.ok) return result;
  return { ok: true as const, room: ctx.room };
}

export function doPlayAgain(socketId: string) {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  if (ctx.playerId !== ctx.room.hostId) {
    return { ok: false as const, message: "Only host can play again." };
  }
  resetToLobby(ctx.room);
  return { ok: true as const, room: ctx.room };
}

export function doChatGif(
  socketId: string,
  gifId: string
): { ok: true; room: InternalRoom; message: ChatMessage } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  if (!TOLLYWOOD_GIF_IDS.has(gifId)) {
    return { ok: false, message: "Unknown Tollywood GIF." };
  }
  const player = ctx.room.players.find((p) => p.id === ctx.playerId);
  if (!player) return { ok: false, message: "Player not found." };
  const message: ChatMessage = {
    id: randomUUID(),
    playerId: player.id,
    nickname: player.nickname,
    gifId,
    at: Date.now(),
  };
  return { ok: true, room: ctx.room, message };
}

export function disconnectSocket(socketId: string): InternalRoom | null {
  const binding = socketToRoom.get(socketId);
  if (!binding) return null;
  socketToRoom.delete(socketId);
  const room = rooms.get(binding.roomCode);
  if (!room) return null;
  handleDisconnectLogic(room, binding.playerId);
  if (room.players.filter((p) => p.connected).length === 0) {
    rooms.delete(room.code);
    return null;
  }
  return room;
}

function requirePlayer(socketId: string) {
  const binding = socketToRoom.get(socketId);
  if (!binding) return { ok: false as const, message: "Not in a room." };
  const room = rooms.get(binding.roomCode);
  if (!room) return { ok: false as const, message: "Room not found." };
  return { ok: true as const, room, playerId: binding.playerId };
}

function maskPool(phase: string, pool: Chit[]): Chit[] {
  // During throwing before throw, pool empty. During picking show text so players can choose "randomly" but still see folded style — plan says pick from thrown chits; show backs with ids, reveal text on own hand only.
  if (phase === "picking") {
    return pool.map((c) => ({
      id: c.id,
      text: "?",
      ownerId: c.ownerId,
    }));
  }
  return [];
}

export function toPublicRoom(room: InternalRoom, viewerId: string): PublicRoom {
  const players: PublicPlayer[] = [...room.players]
    .sort((a, b) => a.seat - b.seat)
    .map((p) => ({
      id: p.id,
      nickname: p.nickname,
      seat: p.seat,
      connected: p.connected,
      hasSubmittedChits: !!p.submittedTexts,
      hasPicked: p.hasPicked,
      handCount: p.hand.length,
      hand:
        p.id === viewerId
          ? p.hand.map((c) => ({ ...c }))
          : room.phase === "revealed" && room.winnerId === p.id
            ? (room.winnerChits ?? []).map((c) => ({ ...c }))
            : [],
    }));

  return {
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    throwerId: room.throwerId,
    players,
    pool: maskPool(room.phase, room.pool),
    currentTurnPlayerId: room.currentTurnPlayerId,
    winnerId: room.winnerId,
    winnerChits: room.winnerChits,
    youPlayerId: viewerId,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
  };
}

export function listViewerSocketIds(room: InternalRoom): { socketId: string; playerId: string }[] {
  return room.players
    .filter((p) => p.connected)
    .map((p) => ({ socketId: p.socketId, playerId: p.id }));
}
