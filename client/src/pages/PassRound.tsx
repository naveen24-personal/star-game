import { useState } from "react";
import type { PublicRoom } from "@chit/shared";
import { api } from "../socket";
import { ChitCard } from "../components/ChitCard";
import { TableWorkspace } from "../components/TableWorkspace";

type Props = { room: PublicRoom };

export function PassRound({ room }: Props) {
  const myTurn = room.currentTurnPlayerId === room.youPlayerId;
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const turnPlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
  const [selected, setSelected] = useState<string | null>(null);

  const myIndex = room.players.findIndex((p) => p.id === room.youPlayerId);
  const right = room.players[(myIndex + 1) % room.players.length];

  return (
    <TableWorkspace
      room={room}
      seatNote={(p) => {
        const bits = [`${p.handCount} chit${p.handCount === 1 ? "" : "s"}`];
        if (p.id === room.currentTurnPlayerId) bits.push("turn");
        return bits.join(" · ");
      }}
      center={
        <div className="table-action">
          <p className="eyebrow">Passing around the table</p>
          <h2 className="table-action__title">Pass one to the right</h2>
          <p className="lede table-action__lede">
            {myTurn
              ? `Your turn — pass one chit to ${right?.nickname ?? "right"}.`
              : `Waiting for ${turnPlayer?.nickname ?? "player"}…`}
          </p>
          <div className="chit-grid chit-grid--compact">
            {(you?.hand ?? []).map((chit) => (
              <ChitCard
                key={chit.id}
                chit={chit}
                selected={selected === chit.id}
                onClick={myTurn ? () => setSelected(chit.id) : undefined}
                disabled={!myTurn}
              />
            ))}
          </div>
          {myTurn && (
            <button
              type="button"
              className="btn btn--primary"
              disabled={!selected}
              onClick={() => {
                if (selected) {
                  api.pass(selected);
                  setSelected(null);
                }
              }}
            >
              Pass to {right?.nickname ?? "right"}
            </button>
          )}
        </div>
      }
    />
  );
}
