import type { PublicRoom } from "./types";
import type { PublicBingoRoom } from "./bingoTypes";
import type { PublicRummyRoom } from "./rummyTypes";
import type { PublicSnakesRoom } from "./snakesTypes";

export type RoomUpdate =
  | PublicRoom
  | PublicBingoRoom
  | PublicRummyRoom
  | PublicSnakesRoom;

export function roomGameId(room: RoomUpdate): RoomUpdate["gameId"] {
  return room.gameId;
}
