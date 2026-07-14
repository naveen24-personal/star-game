import { useState } from "react";
import type { PublicRoom } from "@chit/shared";
import { api } from "../socket";
import { ChitCard } from "../components/ChitCard";
import { TableWorkspace } from "../components/TableWorkspace";
import type { GifPopItem } from "../components/GifPops";

type Props = { room: PublicRoom; pops?: GifPopItem[] };

export function PassRound({ room, pops = [] }: Props) {
  const myTurn = room.currentTurnPlayerId === room.youPlayerId;
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const turnPlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
  const [selected, setSelected] = useState<string | null>(null);

  const myIndex = room.players.findIndex((p) => p.id === room.youPlayerId);
  const right = room.players[(myIndex + 1) % room.players.length];

  return (
    <TableWorkspace
      room={room}
      pops={pops}
      seatNote={(p) => {
        const bits = [`${p.handCount}`];
        if (p.id === room.currentTurnPlayerId) bits.push("turn");
        return bits.join(" · ");
      }}
      tableTop={
        <div className="table-hud">
          <p className="table-hud__label">
            {myTurn
              ? `Pass one to ${right?.nickname ?? "right"}`
              : `${turnPlayer?.nickname ?? "Player"}’s turn`}
          </p>
        </div>
      }
      controls={
        <div className="table-controls__inner">
          <p className="eyebrow">Your hand</p>
          <h2 className="table-action__title">Pass one to the right</h2>
          <div className="hand-row">
            {(you?.hand ?? []).map((chit) => (
              <ChitCard
                key={chit.id}
                chit={chit}
                unfold
                selected={selected === chit.id}
                size="tiny"
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
