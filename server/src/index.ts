import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { GIF_CATEGORIES } from "@chit/shared";
import {
  createRoom,
  disconnectSocket,
  doChatGif,
  doClaim,
  doPass,
  doPlayAgain,
  doRelease,
  doSubmitChits,
  doThrow,
  joinRoom,
  listViewerSocketIds,
  startGame,
  toPublicRoom,
} from "./roomManager";
import type { InternalRoom } from "./gameLogic";
import { resolveCategoryQuery, searchTenorGifs } from "./tenor";

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(cors({ origin: isProd ? true : CLIENT_ORIGIN }));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/gifs/categories", (_req, res) => {
  res.json({ categories: GIF_CATEGORIES });
});

app.get("/api/gifs/search", async (req, res) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const qRaw = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const pos = typeof req.query.pos === "string" ? req.query.pos : undefined;
    const categoryQuery = resolveCategoryQuery(category);
    const q = qRaw || categoryQuery || "telugu memes";
    const result = await searchTenorGifs({ q, pos, limit: 30 });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "GIF search failed";
    res.status(502).json({ items: [], next: null, error: message });
  }
});

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
    const result = createRoom(socket.id, payload?.nickname ?? "");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    socket.join(result.room.code);
    emitRoom(result.room);
  });

  socket.on("room:join", (payload: { code?: string; nickname?: string }) => {
    const result = joinRoom(socket.id, payload?.code ?? "", payload?.nickname ?? "");
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

  socket.on("chits:submit", (payload: { text?: string; texts?: string[] }) => {
    const text =
      typeof payload?.text === "string"
        ? payload.text
        : Array.isArray(payload?.texts)
          ? String(payload.texts[0] ?? "")
          : "";
    const result = doSubmitChits(socket.id, text);
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

  socket.on("chits:claim", (payload: { chitId?: string }) => {
    const result = doClaim(socket.id, payload?.chitId ?? "");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom(result.room);
  });

  socket.on("chits:release", (payload: { chitId?: string }) => {
    const result = doRelease(socket.id, payload?.chitId ?? "");
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

  socket.on(
    "chat:gif",
    (payload: { gifId?: string; gifUrl?: string; label?: string }) => {
      const result = doChatGif(socket.id, payload ?? {});
      if (!result.ok) {
        emitError(socket.id, result.message);
        return;
      }
      io.to(result.room.code).emit("chat:message", result.message);
    }
  );

  socket.on("disconnect", () => {
    const room = disconnectSocket(socket.id);
    if (room) emitRoom(room);
  });
});

server.listen(PORT, () => {
  console.log(`Chit game server on http://localhost:${PORT} (${isProd ? "prod" : "dev"})`);
});

export { io, server };
