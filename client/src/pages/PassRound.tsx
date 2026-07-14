import { useState } from "react";
import type { PublicRoom } from "@chit/shared";
import { api } from "../socket";
import { ChitCard } from "../components/ChitCard";

type Props = { room: PublicRoom };

export function PassRound({ room }: Props) {
  const myTurn = room.currentTurnPlayerId === room.youPlayerId;
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const turnPlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
  const [selected, setSelected] = useState<string | null>(null);

  const myIndex = room.players.findIndex((p) => p.id === room.youPlayerId);
  const right = room.players[(myIndex + 1) % room.players.length];

  return (
    <section className="panel">
      <p className="eyebrow">Passing</p>
      <h2 className="title">Pass one chit to the right</h2>
      <p className="lede">
        {myTurn
          ? `Your turn — pass one chit to ${right?.nickname ?? "right"}.`
          : `Waiting for ${turnPlayer?.nickname ?? "player"}…`}
      </p>

      <ul className="player-list compact">
        {room.players.map((p) => (
          <li key={p.id} className={p.id === room.currentTurnPlayerId ? "turn" : ""}>
            {p.nickname}: {p.handCount} chit{p.handCount === 1 ? "" : "s"}
            {p.id === room.currentTurnPlayerId ? " · turn" : ""}
          </li>
        ))}
      </ul>

      <h3 className="subtitle">Your hand</h3>
      <div className="chit-grid">
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
    </section>
  );
}
