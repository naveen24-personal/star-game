import type { PublicRoom } from "@chit/shared";
import { CHITS_PER_PLAYER } from "@chit/shared";
import { api } from "../socket";
import { ChitCard } from "../components/ChitCard";

type Props = { room: PublicRoom };

export function ThrowAndPick({ room }: Props) {
  const isThrower = room.throwerId === room.youPlayerId;
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const hand = you?.hand ?? [];
  const claimed = hand.length;
  const locked = you?.hasPicked ?? false;

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

  return (
    <section className="panel">
      <p className="eyebrow">Pick</p>
      <h2 className="title">
        Pick {CHITS_PER_PLAYER} chits ({claimed}/{CHITS_PER_PLAYER})
      </h2>
      <p className="lede">
        Tap a folded chit to claim it instantly. Taken chits disappear for everyone else. Tap one of
        yours to release it before you lock {CHITS_PER_PLAYER}.
      </p>

      {locked ? (
        <p className="status">You locked in {CHITS_PER_PLAYER}. Waiting for others…</p>
      ) : (
        <>
          <h3 className="subtitle">Pool ({room.pool.length} left)</h3>
          <div className="chit-grid">
            {room.pool.map((chit) => (
              <ChitCard
                key={chit.id}
                chit={chit}
                faceDown
                disabled={claimed >= CHITS_PER_PLAYER}
                onClick={() => api.claim(chit.id)}
              />
            ))}
          </div>
          {room.pool.length === 0 && (
            <p className="muted">No folded chits left in the pool.</p>
          )}
        </>
      )}

      <h3 className="subtitle">Your claims</h3>
      <div className="chit-grid">
        {hand.map((chit) => (
          <ChitCard
            key={chit.id}
            chit={chit}
            faceDown
            selected
            disabled={locked}
            onClick={locked ? undefined : () => api.release(chit.id)}
          />
        ))}
        {hand.length === 0 && <p className="muted">None yet — claim from the pool.</p>}
      </div>

      <ul className="player-list compact">
        {room.players.map((p) => (
          <li key={p.id}>
            {p.nickname}: {p.hasPicked ? "locked 4" : `${p.handCount}/4 claiming…`}
          </li>
        ))}
      </ul>
    </section>
  );
}
