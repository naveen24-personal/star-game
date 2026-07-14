import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import {
  createRoom,
  disconnectSocket,
  doChatGif,
  doPass,
  doPick,
  doPlayAgain,
  doSubmitChits,
  doThrow,
  getBinding,
  joinRoom,
  listViewerSocketIds,
  startGame,
  toPublicRoom,
} from "./roomManager";
import type { InternalRoom } from "./gameLogic";

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(cors({ origin: isProd ? true : CLIENT_ORIGIN }));
app.get("/health", (_req, res) => res.json({ ok: true }));

if (isProd) {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: isProd ? true : CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

function emitRoom(room: InternalRoom) {
  for (const { socketId, playerId } of listViewerSocketIds(room)) {
    io.to(socketId).emit("room:update", toPublicRoom(room, playerId));
  }
}

function emitError(socketId: string, message: string) {
  io.to(socketId).emit("room:error", { message });
}

io.on("connection", (socket) => {
  socket.on("room:create", (payload: { nickname?: string }) => {
    const nickname = payload?.nickname ?? "Player";
    const { room } = createRoom(socket.id, nickname);
    socket.join(room.code);
    emitRoom(room);
  });

  socket.on("room:join", (payload: { code?: string; nickname?: string }) => {
    const result = joinRoom(socket.id, payload?.code ?? "", payload?.nickname ?? "Player");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    socket.join(result.room.code);
    emitRoom(result.room);
  });

  socket.on("room:start", () => {
    const result = startGame(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom(result.room);
  });

  socket.on("chits:submit", (payload: { texts?: string[] }) => {
    const result = doSubmitChits(socket.id, payload?.texts ?? []);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom(result.room);
  });

  socket.on("chits:throw", () => {
    const result = doThrow(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom(result.room);
  });

  socket.on("chits:pick", (payload: { chitIds?: string[] }) => {
    const result = doPick(socket.id, payload?.chitIds ?? []);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom(result.room);
  });

  socket.on("chits:pass", (payload: { chitId?: string }) => {
    const result = doPass(socket.id, payload?.chitId ?? "");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom(result.room);
  });

  socket.on("room:playAgain", () => {
    const result = doPlayAgain(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom(result.room);
  });

  socket.on("chat:gif", (payload: { gifId?: string }) => {
    const result = doChatGif(socket.id, payload?.gifId ?? "");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    io.to(result.room.code).emit("chat:message", result.message);
  });

  socket.on("disconnect", () => {
    const room = disconnectSocket(socket.id);
    if (room) emitRoom(room);
  });
});

server.listen(PORT, () => {
  console.log(`Chit game server on http://localhost:${PORT} (${isProd ? "prod" : "dev"})`);
});

export { io, server };
