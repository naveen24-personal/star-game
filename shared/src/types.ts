export type RoomPhase =
  | "lobby"
  | "writing"
  | "throwing"
  | "picking"
  | "passing"
  | "revealed";

export interface Chit {
  id: string;
  text: string;
  ownerId: string | null;
}

export interface PublicPlayer {
  id: string;
  nickname: string;
  seat: number;
  connected: boolean;
  hasSubmittedChits: boolean;
  hasPicked: boolean;
  handCount: number;
  /** Own hand texts only for the viewing player; others see empty */
  hand: Chit[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  /** Catalog id or Tenor id */
  gifId: string;
  gifUrl: string;
  label: string;
  at: number;
}

export interface GifSearchItem {
  id: string;
  label: string;
  gifUrl: string;
  previewUrl: string;
}

export interface GifCategory {
  id: string;
  label: string;
  query: string;
}

export interface PassEvent {
  fromPlayerId: string;
  toPlayerId: string;
  chitId: string;
}

export interface PublicRoom {
  gameId: "chit";
  code: string;
  phase: RoomPhase;
  hostId: string;
  throwerId: string;
  players: PublicPlayer[];
  /** Pool chits: text hidden until picking starts; during picking text may be shown face-down style via id only or shuffled face */
  pool: Chit[];
  currentTurnPlayerId: string | null;
  winnerId: string | null;
  winnerChits: Chit[] | null;
  youPlayerId: string;
  minPlayers: number;
  maxPlayers: number;
  lastPass: PassEvent | null;
}

export interface RoomErrorPayload {
  message: string;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;
export const CHITS_PER_PLAYER = 4;

/** Categories shown in the GIF picker (Tenor search queries). */
export const GIF_CATEGORIES: GifCategory[] = [
  { id: "telugu", label: "Telugu", query: "telugu memes" },
  { id: "tollywood", label: "Tollywood", query: "tollywood" },
  { id: "comedy", label: "Comedy", query: "telugu comedy" },
  { id: "reactions", label: "Reactions", query: "reaction gif" },
  { id: "happy", label: "Happy", query: "happy celebration" },
  { id: "sad", label: "Sad", query: "sad crying" },
  { id: "love", label: "Love", query: "love heart" },
  { id: "dance", label: "Dance", query: "dance party" },
  { id: "angry", label: "Angry", query: "angry mad" },
  { id: "trending", label: "Trending", query: "trending" },
];

export function normalizeChitText(text: string): string {
  return text.trim().toLowerCase();
}

/** Nickname uniqueness is case-insensitive. */
export function normalizeNickname(nickname: string): string {
  return nickname.trim().slice(0, 24);
}

export function nicknamesEqual(a: string, b: string): boolean {
  return normalizeNickname(a).toLowerCase() === normalizeNickname(b).toLowerCase();
}

export function chitsMatch(a: string, b: string): boolean {
  return normalizeChitText(a) === normalizeChitText(b);
}

export function hasFourOfAKind(hand: Chit[]): boolean {
  if (hand.length !== CHITS_PER_PLAYER) return false;
  const first = normalizeChitText(hand[0].text);
  return hand.every((c) => normalizeChitText(c.text) === first);
}

/** Only allow known public GIF CDNs. */
export function isAllowedGifUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return (
      host === "media.tenor.com" ||
      host.endsWith(".tenor.com") ||
      host === "media.giphy.com" ||
      host.endsWith(".giphy.com") ||
      host === "i.giphy.com"
    );
  } catch {
    return false;
  }
}
