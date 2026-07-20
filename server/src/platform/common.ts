import { randomUUID } from "crypto";

const usedCodes = new Set<string>();
const codeToGame = new Map<string, "chit" | "bingo" | "rummy" | "snakes">();

export function createRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function uniqueRoomCode(): string {
  for (let i = 0; i < 30; i++) {
    const code = createRoomCode();
    if (!usedCodes.has(code)) {
      usedCodes.add(code);
      return code;
    }
  }
  const code = createRoomCode() + createRoomCode().slice(0, 2);
  usedCodes.add(code);
  return code;
}

export function registerRoomCode(code: string, gameId: "chit" | "bingo" | "rummy" | "snakes"): void {
  usedCodes.add(code);
  codeToGame.set(code, gameId);
}

export function releaseRoomCode(code: string): void {
  usedCodes.delete(code);
  codeToGame.delete(code);
}

export function newId(): string {
  return randomUUID();
}

export interface SocketBinding {
  roomCode: string;
  playerId: string;
  gameId: "chit" | "bingo" | "rummy" | "snakes";
}

const socketToBinding = new Map<string, SocketBinding>();

export function setBinding(socketId: string, binding: SocketBinding): void {
  socketToBinding.set(socketId, binding);
}

export function getBinding(socketId: string): SocketBinding | undefined {
  return socketToBinding.get(socketId);
}

export function clearBinding(socketId: string): SocketBinding | undefined {
  const b = socketToBinding.get(socketId);
  socketToBinding.delete(socketId);
  return b;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
