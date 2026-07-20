import { io, Socket } from "socket.io-client";
import type { ChatMessage, GameId, RoomErrorPayload, RoomUpdate } from "@chit/shared";

export const apiBase = import.meta.env.PROD ? "" : "";
const URL = import.meta.env.PROD ? undefined : "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  return socket;
}

export type RoomHandlers = {
  onRoom: (room: RoomUpdate) => void;
  onError: (err: RoomErrorPayload) => void;
  onChat: (msg: ChatMessage) => void;
};

export function bindRoomHandlers(handlers: RoomHandlers) {
  const s = getSocket();
  s.on("room:update", handlers.onRoom);
  s.on("room:error", handlers.onError);
  s.on("chat:message", handlers.onChat);
  return () => {
    s.off("room:update", handlers.onRoom);
    s.off("room:error", handlers.onError);
    s.off("chat:message", handlers.onChat);
  };
}

export const api = {
  create: (nickname: string, gameId: GameId) =>
    getSocket().emit("room:create", { nickname, gameId }),
  join: (code: string, nickname: string, gameId: GameId) =>
    getSocket().emit("room:join", { code, nickname, gameId }),
  start: () => getSocket().emit("room:start"),
  submitChitText: (text: string) => getSocket().emit("chits:submit", { text }),
  throwChits: () => getSocket().emit("chits:throw"),
  claim: (chitId: string) => getSocket().emit("chits:claim", { chitId }),
  release: (chitId: string) => getSocket().emit("chits:release", { chitId }),
  pass: (chitId: string) => getSocket().emit("chits:pass", { chitId }),
  playAgain: () => getSocket().emit("room:playAgain"),
  bingoCall: () => getSocket().emit("bingo:call"),
  bingoClaim: () => getSocket().emit("bingo:claim"),
  rummyDrawDeck: () => getSocket().emit("rummy:drawDeck"),
  rummyDrawDiscard: () => getSocket().emit("rummy:drawDiscard"),
  rummyDiscard: (cardId: string) => getSocket().emit("rummy:discard", { cardId }),
  rummyDeclare: () => getSocket().emit("rummy:declare"),
  snakesRoll: () => getSocket().emit("snakes:roll"),
  sendGif: (payload: { gifId: string; gifUrl: string; label: string }) =>
    getSocket().emit("chat:gif", payload),
};
