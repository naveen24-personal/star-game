import type { PublicPlayer, PublicRoom } from "@chit/shared";
import type { ReactNode } from "react";

type Props = {
  room: PublicRoom;
  /** Extra status under a seat nickname */
  seatNote?: (player: PublicPlayer) => string | null;
  center: ReactNode;
  footer?: ReactNode;
};

/** Seat "you" at the bottom; others clockwise around the table. */
function seatsForViewer(room: PublicRoom): PublicPlayer[] {
  const sorted = [...room.players].sort((a, b) => a.seat - b.seat);
  const myIdx = sorted.findIndex((p) => p.id === room.youPlayerId);
  if (myIdx <= 0) return sorted;
  return [...sorted.slice(myIdx), ...sorted.slice(0, myIdx)];
}

function seatPosition(index: number, total: number): { left: string; top: string } {
  // index 0 at bottom; then clockwise
  const angle = Math.PI / 2 + (index * 2 * Math.PI) / Math.max(total, 1);
  const radius = total <= 3 ? 38 : total <= 5 ? 40 : 42;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  return { left: `${x}%`, top: `${y}%` };
}

export function TableWorkspace({ room, seatNote, center, footer }: Props) {
  const seats = seatsForViewer(room);

  return (
    <section className="panel table-wrap">
      <div className="table-arena" aria-label="Players sitting around the table">
        <div className="table-surface">
          <div className="table-surface__wood" />
          <div className="table-surface__center">{center}</div>
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
              style={pos}
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
      </div>
      {footer}
    </section>
  );
}
