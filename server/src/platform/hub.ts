import type { GameId, RoomUpdate } from "@chit/shared";
import { isGameId } from "@chit/shared";
import { ChatMessage, getGifById, isAllowedGifUrl } from "@chit/shared";
import { randomUUID } from "crypto";
import type { InternalRoom } from "../gameLogic";
import * as bingo from "../games/bingo/manager";
import * as rummy from "../games/rummy/manager";
import * as snakes from "../games/snakes/manager";
import {
  clearBinding,
  getBinding,
  registerRoomCode,
  releaseRoomCode,
  setBinding,
} from "./common";
import * as chit from "../roomManager";

export function createRoom(
  gameId: string,
  socketId: string,
  nickname: string
): { ok: true; code: string; gameId: GameId } | { ok: false; message: string } {
  if (!isGameId(gameId)) return { ok: false, message: "Unknown game." };

  switch (gameId) {
    case "chit": {
      const result = chit.createRoom(socketId, nickname);
      if (!result.ok) return result;
      registerRoomCode(result.room.code, "chit");
      setBinding(socketId, { roomCode: result.room.code, playerId: result.playerId, gameId: "chit" });
      return { ok: true, code: result.room.code, gameId: "chit" };
    }
    case "bingo": {
      const result = bingo.createRoom(socketId, nickname);
      if (!result.ok) return result;
      registerRoomCode(result.room.code, "bingo");
      return { ok: true, code: result.room.code, gameId: "bingo" };
    }
    case "rummy": {
      const result = rummy.createRoom(socketId, nickname);
      if (!result.ok) return result;
      registerRoomCode(result.room.code, "rummy");
      return { ok: true, code: result.room.code, gameId: "rummy" };
    }
    case "snakes": {
      const result = snakes.createRoom(socketId, nickname);
      if (!result.ok) return result;
      registerRoomCode(result.room.code, "snakes");
      return { ok: true, code: result.room.code, gameId: "snakes" };
    }
  }
}

export function joinRoom(
  gameId: string | undefined,
  socketId: string,
  code: string,
  nickname: string
): { ok: true; gameId: GameId } | { ok: false; message: string } {
  const upper = code.trim().toUpperCase();
  const byCode = lookupGameId(upper);
  if (!byCode) return { ok: false, message: "Room not found." };
  if (gameId && isGameId(gameId) && gameId !== byCode) {
    return { ok: false, message: "That code is for a different game — open the right game first." };
  }
  const resolved = byCode;

  switch (resolved) {
    case "chit": {
      const result = chit.joinRoom(socketId, upper, nickname);
      if (!result.ok) return result;
      setBinding(socketId, { roomCode: result.room.code, playerId: result.playerId, gameId: "chit" });
      return { ok: true, gameId: "chit" };
    }
    case "bingo": {
      const result = bingo.joinRoom(socketId, upper, nickname);
      if (!result.ok) return result;
      return { ok: true, gameId: "bingo" };
    }
    case "rummy": {
      const result = rummy.joinRoom(socketId, upper, nickname);
      if (!result.ok) return result;
      return { ok: true, gameId: "rummy" };
    }
    case "snakes": {
      const result = snakes.joinRoom(socketId, upper, nickname);
      if (!result.ok) return result;
      return { ok: true, gameId: "snakes" };
    }
  }
}

function lookupGameId(code: string): GameId | undefined {
  if (chit.getRoom(code)) return "chit";
  if (bingo.getRoom(code)) return "bingo";
  if (rummy.getRoom(code)) return "rummy";
  if (snakes.getRoom(code)) return "snakes";
  return undefined;
}

export function startGame(socketId: string) {
  const binding = getBinding(socketId) ?? chit.getBinding(socketId);
  if (!binding) return { ok: false as const, message: "Not in a room." };
  switch (binding.gameId) {
    case "chit":
      return chit.startGame(socketId);
    case "bingo":
      return bingo.startGame(socketId);
    case "rummy":
      return rummy.startGame(socketId);
    case "snakes":
      return snakes.startGame(socketId);
  }
}

export function playAgain(socketId: string) {
  const binding = getBinding(socketId) ?? chit.getBinding(socketId);
  if (!binding) return { ok: false as const, message: "Not in a room." };
  switch (binding.gameId) {
    case "chit":
      return chit.doPlayAgain(socketId);
    case "bingo":
      return bingo.playAgain(socketId);
    case "rummy":
      return rummy.playAgain(socketId);
    case "snakes":
      return snakes.playAgain(socketId);
  }
}

export function disconnectSocket(socketId: string): { gameId: GameId; room: unknown } | null {
  const binding = clearBinding(socketId) ?? chit.clearBinding(socketId);
  if (!binding) return null;

  switch (binding.gameId) {
    case "chit": {
      const room = chit.disconnectByBinding(binding.roomCode, binding.playerId);
      if (!room) releaseRoomCode(binding.roomCode);
      return room ? { gameId: "chit", room } : null;
    }
    case "bingo": {
      const room = bingo.disconnectPlayer(binding.roomCode, binding.playerId);
      if (!room) releaseRoomCode(binding.roomCode);
      return room ? { gameId: "bingo", room } : null;
    }
    case "rummy": {
      const room = rummy.disconnectPlayer(binding.roomCode, binding.playerId);
      if (!room) releaseRoomCode(binding.roomCode);
      return room ? { gameId: "rummy", room } : null;
    }
    case "snakes": {
      const room = snakes.disconnectPlayer(binding.roomCode, binding.playerId);
      if (!room) releaseRoomCode(binding.roomCode);
      return room ? { gameId: "snakes", room } : null;
    }
  }
}

export function toPublicRoom(gameId: GameId, room: unknown, viewerId: string): RoomUpdate {
  switch (gameId) {
    case "chit":
      return chit.toPublicRoom(room as InternalRoom, viewerId);
    case "bingo":
      return bingo.toPublicRoom(room as bingo.InternalBingoRoom, viewerId);
    case "rummy":
      return rummy.toPublicRoom(room as rummy.InternalRummyRoom, viewerId);
    case "snakes":
      return snakes.toPublicRoom(room as snakes.InternalSnakesRoom, viewerId);
  }
}

export function listViewerSocketIds(gameId: GameId, room: unknown) {
  switch (gameId) {
    case "chit":
      return chit.listViewerSocketIds(room as InternalRoom);
    case "bingo":
      return bingo.listViewerSocketIds(room as bingo.InternalBingoRoom);
    case "rummy":
      return rummy.listViewerSocketIds(room as rummy.InternalRummyRoom);
    case "snakes":
      return snakes.listViewerSocketIds(room as snakes.InternalSnakesRoom);
  }
}

export function doChatGif(
  socketId: string,
  payload: { gifId?: string; gifUrl?: string; label?: string }
): { ok: true; code: string; message: ChatMessage } | { ok: false; message: string } {
  const binding = getBinding(socketId) ?? chit.getBinding(socketId);
  if (!binding) return { ok: false, message: "Not in a room." };

  const gifUrl = String(payload.gifUrl ?? "").trim();
  const gifId = String(payload.gifId ?? "").trim() || gifUrl;
  const label = String(payload.label ?? "GIF").trim().slice(0, 80) || "GIF";

  let resolvedUrl = gifUrl;
  if (!resolvedUrl && gifId) {
    const fromCatalog = getGifById(gifId);
    if (fromCatalog) resolvedUrl = fromCatalog.gifUrl;
  }
  if (!resolvedUrl || !isAllowedGifUrl(resolvedUrl)) {
    return { ok: false, message: "Invalid GIF. Pick one from Tenor search." };
  }

  let player: { id: string; nickname: string } | undefined;
  let code = binding.roomCode;

  switch (binding.gameId) {
    case "chit": {
      const room = chit.getRoom(code);
      player = room?.players.find((p) => p.id === binding.playerId);
      break;
    }
    case "bingo": {
      const room = bingo.getRoom(code);
      player = bingo.getPlayerForChat(room!, binding.playerId);
      break;
    }
    case "rummy": {
      const room = rummy.getRoom(code);
      player = rummy.getPlayerForChat(room!, binding.playerId);
      break;
    }
    case "snakes": {
      const room = snakes.getRoom(code);
      player = snakes.getPlayerForChat(room!, binding.playerId);
      break;
    }
  }

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
  return { ok: true, code, message };
}

export { chit, bingo, rummy, snakes };
