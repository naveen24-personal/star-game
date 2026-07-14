import type { PublicPlayer, PublicRoom } from "@chit/shared";
import type { ReactNode } from "react";
import { getGifById } from "@chit/shared";
import { seatPosition, seatsForViewer } from "../seatLayout";
import type { GifPopItem } from "./GifPops";

type Props = {
  room: PublicRoom;
  seatNote?: (player: PublicPlayer) => string | null;
  /** Thrown / scattered chits (and light HUD on the wood) */
  tableTop?: ReactNode;
  /** Status + your hand — kept below so the table stays clear */
  controls?: ReactNode;
  pops?: GifPopItem[];
};

export function TableWorkspace({ room, seatNote, tableTop, controls, pops = [] }: Props) {
  const seats = seatsForViewer(room);

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

        {pops.map((pop) => {
          const seat = seats.find((s) => s.id === pop.playerId);
          const idx = seat ? seats.indexOf(seat) : -1;
          const pos =
            idx >= 0
              ? seatPosition(idx, seats.length)
              : { left: 50, top: 50 };
          const gif = getGifById(pop.gifId);
          return (
            <div
              key={pop.id}
              className="gif-pop gif-pop--seat"
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            >
              <span className="gif-pop__who">{pop.nickname}</span>
              {gif ? (
                <img src={gif.gifUrl} alt={gif.label} />
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
