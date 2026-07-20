import {
  Card,
  RUMMY_HAND_SIZE,
  RUMMY_MAX,
  RUMMY_MIN,
  RummyCardEvent,
  Suit,
  isValidRummy4333,
  normalizeNickname,
  nicknamesEqual,
} from "@chit/shared";
import { getBinding, newId, setBinding, shuffle, uniqueRoomCode } from "../../platform/common";

export interface RummyPlayer {
  id: string;
  socketId: string;
  nickname: string;
  seat: number;
  connected: boolean;
  hand: Card[];
  drewThisTurn: boolean;
}

export interface InternalRummyRoom {
  code: string;
  phase: "lobby" | "playing" | "won";
  hostId: string;
  players: RummyPlayer[];
  deck: Card[];
  discard: Card[];
  currentTurnPlayerId: string | null;
  winnerId: string | null;
  lastCardEvent: RummyCardEvent | null;
}

const rooms = new Map<string, InternalRummyRoom>();
const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

function isNicknameTaken(room: InternalRummyRoom, nickname: string): boolean {
  return room.players.some((p) => p.connected && nicknamesEqual(p.nickname, nickname));
}

function connectedPlayers(room: InternalRummyRoom): RummyPlayer[] {
  return room.players.filter((p) => p.connected);
}

function makeDeck(playerCount: number): Card[] {
  const decks = playerCount >= 3 ? 2 : 1;
  const out: Card[] = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        out.push({ id: newId(), suit, rank });
      }
    }
  }
  return shuffle(out);
}

function cardEvent(card: Card, playerId: string, kind: RummyCardEvent["kind"]): RummyCardEvent {
  return { kind, playerId, cardId: card.id, suit: card.suit, rank: card.rank };
}

export function createRoom(
  socketId: string,
  nickname: string
): { ok: true; room: InternalRummyRoom; playerId: string } | { ok: false; message: string } {
  const name = normalizeNickname(nickname);
  if (!name) return { ok: false, message: "Nickname is required." };

  const code = uniqueRoomCode();
  const playerId = newId();
  const room: InternalRummyRoom = {
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
        hand: [],
        drewThisTurn: false,
      },
    ],
    deck: [],
    discard: [],
    currentTurnPlayerId: null,
    winnerId: null,
    lastCardEvent: null,
  };
  rooms.set(code, room);
  setBinding(socketId, { roomCode: code, playerId, gameId: "rummy" });
  return { ok: true, room, playerId };
}

export function joinRoom(
  socketId: string,
  code: string,
  nickname: string
): { ok: true; room: InternalRummyRoom; playerId: string } | { ok: false; message: string } {
  const room = rooms.get(code.trim().toUpperCase());
  if (!room) return { ok: false, message: "Room not found." };
  if (room.phase !== "lobby") return { ok: false, message: "Game already started." };
  if (connectedPlayers(room).length >= RUMMY_MAX) return { ok: false, message: "Room is full." };

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
    hand: [],
    drewThisTurn: false,
  });
  setBinding(socketId, { roomCode: room.code, playerId, gameId: "rummy" });
  return { ok: true, room, playerId };
}

export function startGame(
  socketId: string
): { ok: true; room: InternalRummyRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const { room, playerId } = ctx;
  if (playerId !== room.hostId) return { ok: false, message: "Only host can start." };
  if (room.phase !== "lobby") return { ok: false, message: "Already started." };
  const active = connectedPlayers(room).sort((a, b) => a.seat - b.seat);
  const n = active.length;
  if (n < RUMMY_MIN || n > RUMMY_MAX) {
    return { ok: false, message: `Need ${RUMMY_MIN}–${RUMMY_MAX} players.` };
  }

  const perHand = RUMMY_HAND_SIZE;
  room.deck = makeDeck(n);
  room.discard = [];
  room.lastCardEvent = null;
  for (const p of active) {
    p.hand = room.deck.splice(0, perHand);
    p.drewThisTurn = false;
  }
  const starter = room.deck.pop()!;
  room.discard.push(starter);
  room.phase = "playing";
  room.currentTurnPlayerId = active[0].id;
  room.winnerId = null;
  return { ok: true, room };
}

export function drawDeck(
  socketId: string
): { ok: true; room: InternalRummyRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const { room, playerId } = ctx;
  if (room.phase !== "playing") return { ok: false, message: "Game not in progress." };
  if (room.currentTurnPlayerId !== playerId) return { ok: false, message: "Not your turn." };
  const player = room.players.find((p) => p.id === playerId)!;
  if (player.drewThisTurn) return { ok: false, message: "Already drew this turn." };
  if (room.deck.length === 0) {
    if (room.discard.length <= 1) return { ok: false, message: "Deck empty." };
    const top = room.discard.pop()!;
    room.deck = shuffle(room.discard);
    room.discard = [top];
  }
  const drawn = room.deck.pop()!;
  player.hand.push(drawn);
  player.drewThisTurn = true;
  room.lastCardEvent = cardEvent(drawn, playerId, "draw-deck");
  return { ok: true, room };
}

export function drawDiscard(
  socketId: string
): { ok: true; room: InternalRummyRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const { room, playerId } = ctx;
  if (room.phase !== "playing") return { ok: false, message: "Game not in progress." };
  if (room.currentTurnPlayerId !== playerId) return { ok: false, message: "Not your turn." };
  const player = room.players.find((p) => p.id === playerId)!;
  if (player.drewThisTurn) return { ok: false, message: "Already drew this turn." };
  if (room.discard.length === 0) return { ok: false, message: "Discard pile empty." };
  const drawn = room.discard.pop()!;
  player.hand.push(drawn);
  player.drewThisTurn = true;
  room.lastCardEvent = cardEvent(drawn, playerId, "draw-discard");
  return { ok: true, room };
}

export function discardCard(
  socketId: string,
  cardId: string
): { ok: true; room: InternalRummyRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const { room, playerId } = ctx;
  if (room.phase !== "playing") return { ok: false, message: "Game not in progress." };
  if (room.currentTurnPlayerId !== playerId) return { ok: false, message: "Not your turn." };
  const player = room.players.find((p) => p.id === playerId)!;
  if (!player.drewThisTurn) return { ok: false, message: "Draw a card first." };
  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx < 0) return { ok: false, message: "Card not in hand." };

  const [card] = player.hand.splice(idx, 1);
  room.discard.push(card);
  player.drewThisTurn = false;
  room.lastCardEvent = cardEvent(card, playerId, "discard");

  const order = connectedPlayers(room).sort((a, b) => a.seat - b.seat);
  const curIdx = order.findIndex((p) => p.id === playerId);
  room.currentTurnPlayerId = order[(curIdx + 1) % order.length].id;
  return { ok: true, room };
}

export function declareWin(
  socketId: string
): { ok: true; room: InternalRummyRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  const { room, playerId } = ctx;
  if (room.phase !== "playing") return { ok: false, message: "Game not in progress." };
  if (room.currentTurnPlayerId !== playerId) return { ok: false, message: "Not your turn." };
  const player = room.players.find((p) => p.id === playerId)!;
  if (!player.drewThisTurn) return { ok: false, message: "Draw and group your hand first." };
  if (!isValidRummy4333(player.hand)) {
    return {
      ok: false,
      message: "Invalid hand — arrange as one set/run of 4 and three sets/runs of 3.",
    };
  }
  room.phase = "won";
  room.winnerId = playerId;
  return { ok: true, room };
}

export function playAgain(
  socketId: string
): { ok: true; room: InternalRummyRoom } | { ok: false; message: string } {
  const ctx = requirePlayer(socketId);
  if (!ctx.ok) return ctx;
  if (ctx.playerId !== ctx.room.hostId) {
    return { ok: false, message: "Only host can play again." };
  }
  ctx.room.phase = "lobby";
  ctx.room.deck = [];
  ctx.room.discard = [];
  ctx.room.currentTurnPlayerId = null;
  ctx.room.winnerId = null;
  ctx.room.lastCardEvent = null;
  for (const p of ctx.room.players) {
    p.hand = [];
    p.drewThisTurn = false;
  }
  return { ok: true, room: ctx.room };
}

export function disconnectPlayer(
  roomCode: string,
  playerId: string
): InternalRummyRoom | null {
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

export function getRoom(code: string): InternalRummyRoom | undefined {
  return rooms.get(code);
}

function requirePlayer(socketId: string) {
  const binding = getBinding(socketId);
  if (!binding || binding.gameId !== "rummy") {
    return { ok: false as const, message: "Not in a rummy room." };
  }
  const room = rooms.get(binding.roomCode);
  if (!room) return { ok: false as const, message: "Room not found." };
  return { ok: true as const, room, playerId: binding.playerId };
}

export function toPublicRoom(room: InternalRummyRoom, viewerId: string) {
  const viewer = room.players.find((p) => p.id === viewerId);
  return {
    gameId: "rummy" as const,
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
        handCount: p.hand.length,
        hand: p.id === viewerId ? p.hand.map((c) => ({ ...c })) : [],
      })),
    currentTurnPlayerId: room.currentTurnPlayerId,
    deckCount: room.deck.length,
    discardTop: room.discard.length ? { ...room.discard[room.discard.length - 1] } : null,
    winnerId: room.winnerId,
    youPlayerId: viewerId,
    minPlayers: RUMMY_MIN,
    maxPlayers: RUMMY_MAX,
    mustDiscard: !!viewer?.drewThisTurn,
    lastCardEvent: room.lastCardEvent ? { ...room.lastCardEvent } : null,
  };
}

export function listViewerSocketIds(room: InternalRummyRoom) {
  return room.players
    .filter((p) => p.connected)
    .map((p) => ({ socketId: p.socketId, playerId: p.id }));
}

export function getPlayerForChat(room: InternalRummyRoom, playerId: string) {
  return room.players.find((p) => p.id === playerId);
}
