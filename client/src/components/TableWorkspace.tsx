import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { PublicPlayer, PublicRoom } from "@chit/shared";
import { getGifById } from "@chit/shared";
import {
  opponentPosition,
  opponentsForViewer,
  seatPosition,
  seatsForViewer,
} from "../seatLayout";
import type { GifPopItem } from "./GifPops";
import { OpponentFan } from "./OpponentFan";

type Props = {
  room: PublicRoom;
  seatNote?: (player: PublicPlayer) => string | null;
  /** Center table content (scattered clubbed pile, etc.) */
  tableTop?: ReactNode;
  /** Local player's hand + actions at bottom */
  myHand?: ReactNode;
  /** Optional center banner (turn +2 style status) */
  banner?: ReactNode;
  /** Show clockwise pass ring during passing */
  showPassRing?: boolean;
  pops?: GifPopItem[];
};

function fanAlign(leftPct: number): "left" | "center" | "right" {
  if (leftPct < 28) return "left";
  if (leftPct > 72) return "right";
  return "center";
}

export function TableWorkspace({
  room,
  seatNote,
  tableTop,
  myHand,
  banner,
  showPassRing,
  pops = [],
}: Props) {
  const seats = seatsForViewer(room);
  const opponents = opponentsForViewer(room);
  const [flightKey, setFlightKey] = useState<string | null>(null);

  useEffect(() => {
    const p = room.lastPass;
    if (!p) return;
    const key = `${p.chitId}:${p.fromPlayerId}:${p.toPlayerId}`;
    setFlightKey(key);
    const t = window.setTimeout(() => setFlightKey(null), 750);
    return () => window.clearTimeout(t);
  }, [room.lastPass?.chitId, room.lastPass?.fromPlayerId, room.lastPass?.toPlayerId]);

  const passFlight = (() => {
    if (!flightKey || !room.lastPass) return null;
    const fromIdx = seats.findIndex((s) => s.id === room.lastPass!.fromPlayerId);
    const toIdx = seats.findIndex((s) => s.id === room.lastPass!.toPlayerId);
    if (fromIdx < 0 || toIdx < 0) return null;
    const from = seatPosition(fromIdx, seats.length);
    const to = seatPosition(toIdx, seats.length);
    return { from, to, key: flightKey };
  })();

  return (
    <section className="uno-stage" aria-label="Table after clubbing">
      <div className="uno-stage__glow" aria-hidden />

      <div className="uno-table">
        {opponents.map((p, i) => {
          const pos = opponentPosition(i, opponents.length);
          const isTurn = p.id === room.currentTurnPlayerId;
          const isHost = p.id === room.hostId;
          const note = seatNote?.(p);
          const align = fanAlign(pos.left);
          return (
            <div
              key={p.id}
              className={`uno-opp ${isTurn ? "uno-opp--turn" : ""}`}
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
              data-player-id={p.id}
            >
              <OpponentFan count={p.handCount} align={align} />
              <div className="uno-badge">
                <div className="uno-badge__avatar" aria-hidden>
                  {p.nickname.slice(0, 1).toUpperCase()}
                </div>
                <div className="uno-badge__meta">
                  <span className="uno-badge__name">{p.nickname}</span>
                  <span className="uno-badge__count">
                    {p.handCount}
                    {isHost ? " · host" : ""}
                    {note ? ` · ${note}` : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="uno-center">
          {showPassRing && <div className="uno-ring" aria-hidden />}
          <div className="uno-pile-zone">
            {tableTop}
            {banner && <div className="uno-banner">{banner}</div>}
          </div>
        </div>

        {passFlight && (
          <div
            key={passFlight.key}
            className="pass-flight"
            style={
              {
                ["--x0" as string]: `${passFlight.from.left}%`,
                ["--y0" as string]: `${passFlight.from.top}%`,
                ["--x1" as string]: `${passFlight.to.left}%`,
                ["--y1" as string]: `${passFlight.to.top}%`,
              } as CSSProperties
            }
            aria-hidden
          >
            <span className="pass-flight__chit" />
          </div>
        )}

        {pops.map((pop) => {
          const seat = seats.find((s) => s.id === pop.playerId);
          const idx = seat ? seats.indexOf(seat) : -1;
          const pos =
            idx >= 0 ? seatPosition(idx, seats.length) : { left: 50, top: 50 };
          const url = pop.gifUrl || getGifById(pop.gifId)?.gifUrl;
          return (
            <div
              key={pop.id}
              className="gif-pop gif-pop--seat"
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            >
              <span className="gif-pop__who">{pop.nickname}</span>
              {url ? (
                <img src={url} alt={pop.label || "GIF"} />
              ) : (
                <span className="gif-pop__fallback">{pop.gifId}</span>
              )}
            </div>
          );
        })}

        <div className="uno-me" data-player-id={room.youPlayerId}>
          {myHand}
        </div>
      </div>
    </section>
  );
}
