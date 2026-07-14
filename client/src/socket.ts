import { io, Socket } from "socket.io-client";
import type { ChatMessage, PublicRoom, RoomErrorPayload } from "@chit/shared";

const URL = import.meta.env.PROD ? undefined : "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  return socket;
}

export type RoomHandlers = {
  onRoom: (room: PublicRoom) => void;
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
  create: (nickname: string) => getSocket().emit("room:create", { nickname }),
  join: (code: string, nickname: string) => getSocket().emit("room:join", { code, nickname }),
  start: () => getSocket().emit("room:start"),
  submitChits: (texts: string[]) => getSocket().emit("chits:submit", { texts }),
  throwChits: () => getSocket().emit("chits:throw"),
  pick: (chitIds: string[]) => getSocket().emit("chits:pick", { chitIds }),
  pass: (chitId: string) => getSocket().emit("chits:pass", { chitId }),
  playAgain: () => getSocket().emit("room:playAgain"),
  sendGif: (gifId: string) => getSocket().emit("chat:gif", { gifId }),
};
