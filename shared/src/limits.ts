/** Maximum players allowed in any game room (join + start). */
export const ROOM_MAX_PLAYERS = 64;

export const CHIT_MIN_PLAYERS = 3;
export const BINGO_MIN_PLAYERS = 2;
export const RUMMY_MIN_PLAYERS = 2;
export const SNAKES_MIN_PLAYERS = 2;

export function isRoomFull(connectedCount: number): boolean {
  return connectedCount >= ROOM_MAX_PLAYERS;
}

export function roomCapacityMessage(min: number): string {
  return `Need ${min}–${ROOM_MAX_PLAYERS} players.`;
}
