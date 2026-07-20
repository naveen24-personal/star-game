import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import type { GameId } from "@chit/shared";
import { GIF_CATEGORIES } from "@chit/shared";
import { getBinding } from "./platform/common";
import * as hub from "./platform/hub";
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

function socketBinding(socketId: string) {
  return getBinding(socketId) ?? hub.chit.getBinding(socketId);
}

function getRoomByBinding(binding: { roomCode: string; gameId: GameId }) {
  switch (binding.gameId) {
    case "chit":
      return hub.chit.getRoom(binding.roomCode);
    case "bingo":
      return hub.bingo.getRoom(binding.roomCode);
    case "rummy":
      return hub.rummy.getRoom(binding.roomCode);
    case "snakes":
      return hub.snakes.getRoom(binding.roomCode);
  }
}

function emitRoom(gameId: GameId, room: unknown) {
  for (const { socketId, playerId } of hub.listViewerSocketIds(gameId, room)) {
    io.to(socketId).emit("room:update", hub.toPublicRoom(gameId, room, playerId));
  }
}

function emitError(socketId: string, message: string) {
  io.to(socketId).emit("room:error", { message });
}

io.on("connection", (socket) => {
  socket.on("room:create", (payload: { nickname?: string; gameId?: string }) => {
    const gameId = payload?.gameId ?? "chit";
    const result = hub.createRoom(gameId, socket.id, payload?.nickname ?? "");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    socket.join(result.code);
    const binding = socketBinding(socket.id);
    if (binding) {
      const room = getRoomByBinding(binding);
      if (room) emitRoom(binding.gameId, room);
    }
  });

  socket.on("room:join", (payload: { code?: string; nickname?: string; gameId?: string }) => {
    const result = hub.joinRoom(payload?.gameId, socket.id, payload?.code ?? "", payload?.nickname ?? "");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    const binding = socketBinding(socket.id);
    if (!binding) return;
    socket.join(binding.roomCode);
    const room = getRoomByBinding(binding);
    if (room) emitRoom(binding.gameId, room);
  });

  socket.on("room:start", () => {
    const result = hub.startGame(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    const binding = socketBinding(socket.id);
    if (binding) emitRoom(binding.gameId, result.room);
  });

  socket.on("room:playAgain", () => {
    const result = hub.playAgain(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    const binding = socketBinding(socket.id);
    if (binding) emitRoom(binding.gameId, result.room);
  });

  socket.on("chits:submit", (payload: { text?: string; texts?: string[] }) => {
    const text =
      typeof payload?.text === "string"
        ? payload.text
        : Array.isArray(payload?.texts)
          ? String(payload.texts[0] ?? "")
          : "";
    const result = hub.chit.doSubmitChits(socket.id, text);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("chit", result.room);
  });

  socket.on("chits:throw", () => {
    const result = hub.chit.doThrow(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("chit", result.room);
  });

  socket.on("chits:claim", (payload: { chitId?: string }) => {
    const result = hub.chit.doClaim(socket.id, payload?.chitId ?? "");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("chit", result.room);
  });

  socket.on("chits:release", (payload: { chitId?: string }) => {
    const result = hub.chit.doRelease(socket.id, payload?.chitId ?? "");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("chit", result.room);
  });

  socket.on("chits:pass", (payload: { chitId?: string }) => {
    const result = hub.chit.doPass(socket.id, payload?.chitId ?? "");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("chit", result.room);
  });

  socket.on("bingo:call", () => {
    const result = hub.bingo.callNext(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("bingo", result.room);
  });

  socket.on("bingo:claim", () => {
    const result = hub.bingo.claimBingo(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("bingo", result.room);
  });

  socket.on("rummy:drawDeck", () => {
    const result = hub.rummy.drawDeck(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("rummy", result.room);
  });

  socket.on("rummy:drawDiscard", () => {
    const result = hub.rummy.drawDiscard(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("rummy", result.room);
  });

  socket.on("rummy:discard", (payload: { cardId?: string }) => {
    const result = hub.rummy.discardCard(socket.id, payload?.cardId ?? "");
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("rummy", result.room);
  });

  socket.on("rummy:declare", () => {
    const result = hub.rummy.declareWin(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("rummy", result.room);
  });

  socket.on("snakes:roll", () => {
    const result = hub.snakes.rollDice(socket.id);
    if (!result.ok) {
      emitError(socket.id, result.message);
      return;
    }
    emitRoom("snakes", result.room);
  });

  socket.on(
    "chat:gif",
    (payload: { gifId?: string; gifUrl?: string; label?: string }) => {
      const result = hub.doChatGif(socket.id, payload ?? {});
      if (!result.ok) {
        emitError(socket.id, result.message);
        return;
      }
      io.to(result.code).emit("chat:message", result.message);
    }
  );

  socket.on("disconnect", () => {
    const disconnected = hub.disconnectSocket(socket.id);
    if (disconnected) emitRoom(disconnected.gameId, disconnected.room);
  });
});

server.listen(PORT, () => {
  console.log(`Game party server on http://localhost:${PORT} (${isProd ? "prod" : "dev"})`);
});

export { io, server };
