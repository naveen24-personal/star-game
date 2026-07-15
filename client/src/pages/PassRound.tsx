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
  const hand = you?.hand ?? [];

  const myIndex = room.players.findIndex((p) => p.id === room.youPlayerId);
  const right = room.players[(myIndex + 1) % room.players.length];

  return (
    <TableWorkspace
      room={room}
      pops={pops}
      showPassRing
      seatNote={(p) => (p.id === room.currentTurnPlayerId ? "turn" : null)}
      tableTop={<div className="pass-center-pad" aria-hidden />}
      banner={
        <div className="uno-banner__inner">
          <p className="uno-banner__title">
            {myTurn ? "Your turn" : `${turnPlayer?.nickname ?? "Player"}`}
          </p>
          <p className="uno-banner__sub">
            {myTurn
              ? `Pass one chit to ${right?.nickname ?? "right"}`
              : "Passing around the table →"}
          </p>
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
      myHand={
        <div className="my-hand">
          <div className="my-hand__row">
            {hand.map((chit) => (
              <div
                key={chit.id}
                className={`my-hand__card ${selected === chit.id ? "my-hand__card--selected" : ""}`}
              >
                <ChitCard
                  chit={chit}
                  unfold
                  selected={selected === chit.id}
                  onClick={myTurn ? () => setSelected(chit.id) : undefined}
                  disabled={!myTurn}
                />
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
