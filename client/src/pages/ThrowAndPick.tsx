import { useState } from "react";
import type { PublicRoom } from "@chit/shared";
import { CHITS_PER_PLAYER } from "@chit/shared";
import { api } from "../socket";
import { ChitCard } from "../components/ChitCard";

type Props = { room: PublicRoom };

export function ThrowAndPick({ room }: Props) {
  const isThrower = room.throwerId === room.youPlayerId;
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const [selected, setSelected] = useState<string[]>([]);

  if (room.phase === "throwing") {
    return (
      <section className="panel">
        <p className="eyebrow">Throw</p>
        <h2 className="title">All chits are clubbed</h2>
        <p className="lede">
          {isThrower
            ? "You are the thrower — toss the pile so everyone can pick."
            : "Waiting for the thrower to throw the chits…"}
        </p>
        {isThrower && (
          <button type="button" className="btn btn--primary btn--throw" onClick={() => api.throwChits()}>
            Throw chits
          </button>
        )}
      </section>
    );
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= CHITS_PER_PLAYER) return prev;
      return [...prev, id];
    });
  };

  return (
    <section className="panel">
      <p className="eyebrow">Pick</p>
      <h2 className="title">
        Choose {CHITS_PER_PLAYER} chits ({selected.length}/{CHITS_PER_PLAYER})
      </h2>
      <p className="lede">Folded pile — pick exactly four. You cannot take more.</p>

      {you?.hasPicked ? (
        <p className="status">You locked in 4. Waiting for others…</p>
      ) : (
        <>
          <div className="chit-grid">
            {room.pool.map((chit) => (
              <ChitCard
                key={chit.id}
                chit={chit}
                faceDown
                selected={selected.includes(chit.id)}
                onClick={() => toggle(chit.id)}
              />
            ))}
          </div>
          <button
            type="button"
            className="btn btn--primary"
            disabled={selected.length !== CHITS_PER_PLAYER}
            onClick={() => api.pick(selected)}
          >
            Confirm 4 chits
          </button>
        </>
      )}

      <ul className="player-list compact">
        {room.players.map((p) => (
          <li key={p.id}>
            {p.nickname}: {p.hasPicked ? "picked" : "picking…"}
          </li>
        ))}
      </ul>
    </section>
  );
}
