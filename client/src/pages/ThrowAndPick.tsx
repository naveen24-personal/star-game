import type { PublicRoom } from "@chit/shared";
import { CHITS_PER_PLAYER } from "@chit/shared";
import { api } from "../socket";
import { ChitCard } from "../components/ChitCard";
import { TableWorkspace } from "../components/TableWorkspace";

type Props = { room: PublicRoom };

export function ThrowAndPick({ room }: Props) {
  const isThrower = room.throwerId === room.youPlayerId;
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const hand = you?.hand ?? [];
  const claimed = hand.length;
  const locked = you?.hasPicked ?? false;

  if (room.phase === "throwing") {
    return (
      <TableWorkspace
        room={room}
        seatNote={(p) => (p.id === room.throwerId ? "thrower" : "ready")}
        center={
          <div className="table-action">
            <p className="eyebrow">Clubbed pile</p>
            <h2 className="table-action__title">Chits on the table</h2>
            <div className="pile-stack" aria-hidden>
              <span /><span /><span />
            </div>
            <p className="lede table-action__lede">
              {isThrower
                ? "Throw so everyone around the table can pick."
                : "Waiting for the thrower…"}
            </p>
            {isThrower && (
              <button
                type="button"
                className="btn btn--primary btn--throw"
                onClick={() => api.throwChits()}
              >
                Throw chits
              </button>
            )}
          </div>
        }
      />
    );
  }

  return (
    <TableWorkspace
      room={room}
      seatNote={(p) =>
        p.hasPicked ? "locked 4" : `${p.handCount}/${CHITS_PER_PLAYER}`
      }
      center={
        <div className="table-action">
          <p className="eyebrow">Pick</p>
          <h2 className="table-action__title">
            {claimed}/{CHITS_PER_PLAYER} claimed
          </h2>
          {locked ? (
            <p className="status">Locked in. Waiting for the table…</p>
          ) : (
            <>
              <p className="lede table-action__lede">
                Tap a folded chit to claim it. Taken ones leave the pile.
              </p>
              <div className="chit-grid chit-grid--compact">
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
                <p className="muted">No folded chits left.</p>
              )}
            </>
          )}
        </div>
      }
      footer={
        <div className="table-footer">
          <h3 className="subtitle">Your claims</h3>
          <div className="chit-grid chit-grid--compact">
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
            {hand.length === 0 && (
              <p className="muted">None yet — claim from the center pile.</p>
            )}
          </div>
        </div>
      }
    />
  );
}
