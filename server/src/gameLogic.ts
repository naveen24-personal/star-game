import {
  CHITS_PER_PLAYER,
  Chit,
  hasFourOfAKind,
  MAX_PLAYERS,
  MIN_PLAYERS,
  RoomPhase,
} from "@chit/shared";
import { randomUUID } from "crypto";

export interface InternalPlayer {
  id: string;
  socketId: string;
  nickname: string;
  seat: number;
  connected: boolean;
  submittedTexts: string[] | null;
  hand: Chit[];
  hasPicked: boolean;
}

export interface InternalRoom {
  code: string;
  phase: RoomPhase;
  hostId: string;
  throwerId: string;
  players: InternalPlayer[];
  allChits: Chit[];
  pool: Chit[];
  currentTurnPlayerId: string | null;
  winnerId: string | null;
  winnerChits: Chit[] | null;
}

export function createRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getPlayer(room: InternalRoom, playerId: string): InternalPlayer | undefined {
  return room.players.find((p) => p.id === playerId);
}

export function sortedPlayers(room: InternalRoom): InternalPlayer[] {
  return [...room.players].sort((a, b) => a.seat - b.seat);
}

export function rightHandNeighbor(room: InternalRoom, playerId: string): InternalPlayer | null {
  const ordered = sortedPlayers(room).filter((p) => p.connected);
  if (ordered.length < 2) return null;
  const idx = ordered.findIndex((p) => p.id === playerId);
  if (idx < 0) return null;
  return ordered[(idx + 1) % ordered.length];
}

export function canStart(room: InternalRoom): boolean {
  const n = room.players.filter((p) => p.connected).length;
  return room.phase === "lobby" && n >= MIN_PLAYERS && n <= MAX_PLAYERS;
}

export function startWriting(room: InternalRoom): void {
  room.phase = "writing";
  room.allChits = [];
  room.pool = [];
  room.currentTurnPlayerId = null;
  room.winnerId = null;
  room.winnerChits = null;
  for (const p of room.players) {
    p.submittedTexts = null;
    p.hand = [];
    p.hasPicked = false;
  }
}

/**
 * Player writes one word/phrase; the server creates CHITS_PER_PLAYER identical folded chits.
 */
export function submitChits(
  room: InternalRoom,
  playerId: string,
  text: string
): { ok: true } | { ok: false; message: string } {
  if (room.phase !== "writing") return { ok: false, message: "Not in writing phase." };
  const player = getPlayer(room, playerId);
  if (!player || !player.connected) return { ok: false, message: "Player not found." };
  if (player.submittedTexts) return { ok: false, message: "Already submitted." };
  const cleaned = String(text ?? "").trim();
  if (!cleaned) return { ok: false, message: "Write one non-empty chit text." };

  const texts = Array.from({ length: CHITS_PER_PLAYER }, () => cleaned);
  player.submittedTexts = texts;
  for (const t of texts) {
    room.allChits.push({
      id: randomUUID(),
      text: t,
      ownerId: null,
    });
  }

  const connected = room.players.filter((p) => p.connected);
  if (connected.every((p) => p.submittedTexts)) {
    room.phase = "throwing";
  }
  return { ok: true };
}

export function throwChits(
  room: InternalRoom,
  playerId: string
): { ok: true } | { ok: false; message: string } {
  if (room.phase !== "throwing") return { ok: false, message: "Not in throwing phase." };
  if (playerId !== room.throwerId) return { ok: false, message: "Only the thrower can throw." };
  room.pool = shuffleInPlace([...room.allChits]);
  for (const c of room.pool) c.ownerId = null;
  for (const p of room.players) {
    p.hand = [];
    p.hasPicked = false;
  }
  room.phase = "picking";
  return { ok: true };
}

function finishPickingIfReady(room: InternalRoom): void {
  const connected = room.players.filter((p) => p.connected);
  if (!connected.every((p) => p.hasPicked)) return;

  room.phase = "passing";
  room.currentTurnPlayerId = room.throwerId;
  const throwerStillIn = connected.some((p) => p.id === room.throwerId);
  if (!throwerStillIn && connected.length) {
    room.currentTurnPlayerId = sortedPlayers(room).filter((p) => p.connected)[0].id;
  }
  const win = checkWinner(room);
  if (win) applyWinner(room, win);
}

/**
 * Claim one folded chit immediately. Taken chits leave the pool so others cannot pick them.
 */
export function claimChit(
  room: InternalRoom,
  playerId: string,
  chitId: string
): { ok: true } | { ok: false; message: string } {
  if (room.phase !== "picking") return { ok: false, message: "Not in picking phase." };
  const player = getPlayer(room, playerId);
  if (!player || !player.connected) return { ok: false, message: "Player not found." };
  if (player.hasPicked) return { ok: false, message: "You already locked your 4 chits." };
  if (player.hand.length >= CHITS_PER_PLAYER) {
    return { ok: false, message: `You already have ${CHITS_PER_PLAYER} chits.` };
  }

  const idx = room.pool.findIndex((c) => c.id === chitId);
  if (idx < 0) {
    return { ok: false, message: "That chit was already taken by another player." };
  }

  const [chit] = room.pool.splice(idx, 1);
  chit.ownerId = playerId;
  player.hand.push({ ...chit });

  if (player.hand.length === CHITS_PER_PLAYER) {
    player.hasPicked = true;
    finishPickingIfReady(room);
  }
  return { ok: true };
}

/** Release one of your claimed chits back to the pool before you lock in at 4. */
export function releaseChit(
  room: InternalRoom,
  playerId: string,
  chitId: string
): { ok: true } | { ok: false; message: string } {
  if (room.phase !== "picking") return { ok: false, message: "Not in picking phase." };
  const player = getPlayer(room, playerId);
  if (!player || !player.connected) return { ok: false, message: "Player not found." };
  if (player.hasPicked) return { ok: false, message: "Your 4 chits are already locked." };

  const idx = player.hand.findIndex((c) => c.id === chitId);
  if (idx < 0) return { ok: false, message: "You do not hold that chit." };

  const [chit] = player.hand.splice(idx, 1);
  chit.ownerId = null;
  room.pool.push({ ...chit });
  return { ok: true };
}

/** @deprecated Prefer claimChit — kept for tests that batch-assign known hands. */
export function pickChits(
  room: InternalRoom,
  playerId: string,
  chitIds: string[]
): { ok: true } | { ok: false; message: string } {
  if (room.phase !== "picking") return { ok: false, message: "Not in picking phase." };
  const player = getPlayer(room, playerId);
  if (!player || !player.connected) return { ok: false, message: "Player not found." };
  if (player.hasPicked) return { ok: false, message: "Already picked." };
  if (!Array.isArray(chitIds) || chitIds.length !== CHITS_PER_PLAYER) {
    return { ok: false, message: `Pick exactly ${CHITS_PER_PLAYER} chits.` };
  }
  if (new Set(chitIds).size !== chitIds.length) {
    return { ok: false, message: "Duplicate chit selection." };
  }

  const selected: Chit[] = [];
  for (const id of chitIds) {
    const chit = room.pool.find((c) => c.id === id);
    if (!chit) {
      return {
        ok: false,
        message: "That chit was already taken by another player. Pick from the remaining pool.",
      };
    }
    if (chit.ownerId) return { ok: false, message: "Chit already taken." };
    selected.push(chit);
  }

  for (const chit of selected) {
    chit.ownerId = playerId;
  }
  player.hand = selected.map((c) => ({ ...c }));
  player.hasPicked = true;
  room.pool = room.pool.filter((c) => !chitIds.includes(c.id));
  finishPickingIfReady(room);
  return { ok: true };
}

export function passChit(
  room: InternalRoom,
  playerId: string,
  chitId: string
): { ok: true } | { ok: false; message: string } {
  if (room.phase !== "passing") return { ok: false, message: "Not in passing phase." };
  if (room.currentTurnPlayerId !== playerId) {
    return { ok: false, message: "Not your turn." };
  }
  const player = getPlayer(room, playerId);
  if (!player || !player.connected) return { ok: false, message: "Player not found." };
  const idx = player.hand.findIndex((c) => c.id === chitId);
  if (idx < 0) return { ok: false, message: "You do not hold that chit." };

  const neighbor = rightHandNeighbor(room, playerId);
  if (!neighbor) return { ok: false, message: "No neighbor to pass to." };

  const [chit] = player.hand.splice(idx, 1);
  chit.ownerId = neighbor.id;
  neighbor.hand.push(chit);

  room.currentTurnPlayerId = neighbor.id;

  const win = checkWinner(room);
  if (win) applyWinner(room, win);

  return { ok: true };
}

export function checkWinner(room: InternalRoom): InternalPlayer | null {
  for (const p of room.players) {
    if (!p.connected) continue;
    if (hasFourOfAKind(p.hand)) return p;
  }
  return null;
}

export function applyWinner(room: InternalRoom, winner: InternalPlayer): void {
  room.phase = "revealed";
  room.winnerId = winner.id;
  room.winnerChits = winner.hand.map((c) => ({ ...c }));
  room.currentTurnPlayerId = null;
}

export function resetToLobby(room: InternalRoom): void {
  room.phase = "lobby";
  room.allChits = [];
  room.pool = [];
  room.currentTurnPlayerId = null;
  room.winnerId = null;
  room.winnerChits = null;
  for (const p of room.players) {
    p.submittedTexts = null;
    p.hand = [];
    p.hasPicked = false;
  }
}

export function reassignHostIfNeeded(room: InternalRoom): void {
  const connected = sortedPlayers(room).filter((p) => p.connected);
  if (!connected.length) return;
  if (!connected.some((p) => p.id === room.hostId)) {
    room.hostId = connected[0].id;
    room.throwerId = connected[0].id;
  }
}

export function handleDisconnectLogic(room: InternalRoom, playerId: string): void {
  const player = getPlayer(room, playerId);
  if (!player) return;
  player.connected = false;

  const connected = room.players.filter((p) => p.connected);
  if (connected.length < MIN_PLAYERS && room.phase !== "lobby") {
    resetToLobby(room);
    room.players = connected;
    reassignSeats(room);
    reassignHostIfNeeded(room);
    return;
  }

  room.players = room.players.filter((p) => p.connected || p.id === playerId);
  // Remove fully disconnected from roster in lobby; mid-game keep until reset
  if (room.phase === "lobby") {
    room.players = room.players.filter((p) => p.connected);
    reassignSeats(room);
  }

  reassignHostIfNeeded(room);

  if (room.phase === "passing" && room.currentTurnPlayerId === playerId) {
    const next = rightHandNeighbor(room, playerId);
    room.currentTurnPlayerId = next?.id ?? null;
  }

  if (room.phase === "writing") {
    const alive = room.players.filter((p) => p.connected);
    if (alive.length >= MIN_PLAYERS && alive.every((p) => p.submittedTexts)) {
      room.phase = "throwing";
    }
  }

  if (room.phase === "picking") {
    const alive = room.players.filter((p) => p.connected);
    if (alive.length >= MIN_PLAYERS && alive.every((p) => p.hasPicked)) {
      room.phase = "passing";
      room.currentTurnPlayerId = alive.some((p) => p.id === room.throwerId)
        ? room.throwerId
        : sortedPlayers(room).filter((p) => p.connected)[0]?.id ?? null;
    }
  }
}

function reassignSeats(room: InternalRoom): void {
  room.players
    .sort((a, b) => a.seat - b.seat)
    .forEach((p, i) => {
      p.seat = i;
    });
}
