import {
  ChatMessage,
  Chit,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PublicPlayer,
  PublicRoom,
  getGifById,
  isAllowedGifUrl,
  normalizeNickname,
  nicknamesEqual,
} from "@chit/shared";
import { randomUUID } from "crypto";
import {
  canStart,
  claimChit,
  handleDisconnectLogic,
  InternalPlayer,
  InternalRoom,
  passChit,
  releaseChit,
  resetToLobby,
  startWriting,
  submitChits,
  throwChits,
} from "./gameLogic";
import { uniqueRoomCode } from "./platform/common";

const rooms = new Map<string, InternalRoom>();
const socketToRoom = new Map<string, { roomCode: string; playerId: string }>();

function isNicknameTaken(room: InternalRoom, nickname: string): boolean {
  return room.players.some(
    (p) => p.connected && nicknamesEqual(p.nickname, nickname)
  );
}

export function createRoom(
  socketId: string,
  nickname: string
): { ok: true; room: InternalRoom; playerId: string } | { ok: false; message: string } {
  const name = normalizeNickname(nickname);
  if (!name) return { ok: false, message: "Nickname is required." };

  const code = uniqueRoomCode();
  const playerId = randomUUID();
  const player: InternalPlayer = {
    id: playerId,
    socketId,
    nickname: name,
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
    lastPass: null,
  };
  rooms.set(code, room);
  socketToRoom.set(socketId, { roomCode: code, playerId });
  return { ok: true, room, playerId };
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

  const name = normalizeNickname(nickname);
  if (!name) return { ok: false, message: "Nickname is required." };
  if (isNicknameTaken(room, name)) {
    return { ok: false, message: "That name is already taken. Choose another." };
  }

  const playerId = randomUUID();
  const seat = room.players.length
    ? Math.max(...room.players.map((p) => p.seat)) + 1
    : 0;
  room.players.push({
    id: playerId,
    socketId,
    nickname: name,
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
  const b = socketToRoom.get(socketId);
  if (!b) return undefined;
  return { roomCode: b.roomCode, playerId: b.playerId, gameId: "chit" as const };
}

export function clearBinding(socketId: string) {
  const b = socketToRoom.get(socketId);
  socketToRoom.delete(socketId);
  if (!b) return undefined;
  return { roomCode: b.roomCode, playerId: b.playerId, gameId: "chit" as const };
}

export function disconnectByBinding(roomCode: string, playerId: string): InternalRoom | null {
  const room = rooms.get(roomCode);
  if (!room) return null;
  handleDisconnectLogic(room, playerId);
  if (room.players.filter((p) => p.connected).length === 0) {
    rooms.delete(roomCode);
    return null;
  }
  return room;
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

export function doSubmitChits(socketId: string, text: string) {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const result = submitChits(ctx.room, ctx.playerId, text);
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

export function doClaim(socketId: string, chitId: string) {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const result = claimChit(ctx.room, ctx.playerId, chitId);
  if (!result.ok) return result;
  return { ok: true as const, room: ctx.room };
}

export function doRelease(socketId: string, chitId: string) {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const result = releaseChit(ctx.room, ctx.playerId, chitId);
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
  payload: { gifId?: string; gifUrl?: string; label?: string }
): { ok: true; room: InternalRoom; message: ChatMessage } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;

  const gifUrl = String(payload.gifUrl ?? "").trim();
  const gifId = String(payload.gifId ?? "").trim() || gifUrl;
  const label = String(payload.label ?? "GIF").trim().slice(0, 80) || "GIF";

  // Prefer live Tenor/Giphy URLs; fall back to curated catalog ids
  let resolvedUrl = gifUrl;
  if (!resolvedUrl && gifId) {
    const fromCatalog = getGifById(gifId);
    if (fromCatalog) resolvedUrl = fromCatalog.gifUrl;
  }
  if (!resolvedUrl || !isAllowedGifUrl(resolvedUrl)) {
    return { ok: false, message: "Invalid GIF. Pick one from Tenor search." };
  }

  const player = ctx.room.players.find((p) => p.id === ctx.playerId);
  if (!player) return { ok: false, message: "Player not found." };
  const message: ChatMessage = {
    id: randomUUID(),
    playerId: player.id,
    nickname: player.nickname,
    gifId,
    gifUrl: resolvedUrl,
    label,
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
    gameId: "chit" as const,
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
    lastPass: room.lastPass,
  };
}

export function listViewerSocketIds(room: InternalRoom): { socketId: string; playerId: string }[] {
  return room.players
    .filter((p) => p.connected)
    .map((p) => ({ socketId: p.socketId, playerId: p.id }));
}
