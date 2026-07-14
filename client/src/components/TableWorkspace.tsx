import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { PublicPlayer, PublicRoom } from "@chit/shared";
import { getGifById } from "@chit/shared";
import { seatPosition, seatsForViewer } from "../seatLayout";
import type { GifPopItem } from "./GifPops";

type Props = {
  room: PublicRoom;
  seatNote?: (player: PublicPlayer) => string | null;
  tableTop?: ReactNode;
  controls?: ReactNode;
  pops?: GifPopItem[];
};

export function TableWorkspace({ room, seatNote, tableTop, controls, pops = [] }: Props) {
  const seats = seatsForViewer(room);
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
    <section className="panel table-wrap">
      <div
        className={`table-arena table-arena--n${Math.min(seats.length, 8)}`}
        aria-label="Players sitting around the table"
      >
        <div className="table-surface">
          <div className="table-surface__wood" />
          <div className="table-surface__play">{tableTop}</div>
        </div>

        {seats.map((p, i) => {
          const pos = seatPosition(i, seats.length);
          const isYou = p.id === room.youPlayerId;
          const isTurn = p.id === room.currentTurnPlayerId;
          const isHost = p.id === room.hostId;
          const note = seatNote?.(p);
          return (
            <div
              key={p.id}
              className={[
                "table-seat",
                isYou ? "table-seat--you" : "",
                isTurn ? "table-seat--turn" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
              data-player-id={p.id}
            >
              <div className="table-seat__avatar" aria-hidden>
                {p.nickname.slice(0, 1).toUpperCase()}
              </div>
              <div className="table-seat__name">
                {p.nickname}
                {isYou ? " (you)" : ""}
              </div>
              <div className="table-seat__meta">
                {isHost ? "host" : ""}
                {isHost && note ? " · " : ""}
                {note ?? ""}
              </div>
            </div>
          );
        })}

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
            <span className="pass-flight__chit">Folded</span>
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
      </div>

      {controls && <div className="table-controls">{controls}</div>}
    </section>
  );
}
