import type { PublicRoom } from "@chit/shared";
import { CHITS_PER_PLAYER } from "@chit/shared";
import { api } from "../socket";
import { ChitCard } from "../components/ChitCard";
import { ScatteredPool } from "../components/ScatteredPool";
import { TableWorkspace } from "../components/TableWorkspace";
import type { GifPopItem } from "../components/GifPops";

type Props = { room: PublicRoom; pops?: GifPopItem[] };

export function ThrowAndPick({ room, pops = [] }: Props) {
  const isThrower = room.throwerId === room.youPlayerId;
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const hand = you?.hand ?? [];
  const claimed = hand.length;
  const locked = you?.hasPicked ?? false;

  if (room.phase === "throwing") {
    return (
      <TableWorkspace
        room={room}
        pops={pops}
        seatNote={(p) => (p.id === room.throwerId ? "thrower" : "ready")}
        tableTop={
          <div className="table-hud">
            <div className="pile-stack pile-stack--center" aria-hidden>
              <span />
              <span />
              <span />
              <span />
            </div>
            <p className="table-hud__label">Clubbed — ready to throw</p>
          </div>
        }
        controls={
          <div className="table-controls__inner">
            <p className="eyebrow">Throw</p>
            <h2 className="table-action__title">Toss the chits on the table</h2>
            <p className="lede">
              {isThrower
                ? "Throw so they land randomly — like at home."
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
      pops={pops}
      seatNote={(p) =>
        p.hasPicked ? "locked 4" : `${p.handCount}/${CHITS_PER_PLAYER}`
      }
      tableTop={
        locked ? (
          <div className="table-hud">
            <p className="table-hud__label">You locked 4 — waiting on others</p>
          </div>
        ) : (
          <ScatteredPool
            chits={room.pool}
            faceDown
            thrown
            disabled={claimed >= CHITS_PER_PLAYER}
            onClaim={(id) => api.claim(id)}
          />
        )
      }
      controls={
        <div className="table-controls__inner">
          <div className="table-controls__row">
            <div>
              <p className="eyebrow">Your claims</p>
              <h2 className="table-action__title">
                {claimed}/{CHITS_PER_PLAYER}
              </h2>
            </div>
            <p className="lede table-controls__hint">
              Tap a scattered chit to pick it. Claimed chits unfold for you.
            </p>
          </div>
          <div className="hand-row">
            {hand.map((chit) => (
              <ChitCard
                key={chit.id}
                chit={chit}
                unfold
                selected
                size="tiny"
                disabled={locked}
                onClick={locked ? undefined : () => api.release(chit.id)}
              />
            ))}
            {hand.length === 0 && (
              <p className="muted">None yet — grab from the table.</p>
            )}
          </div>
        </div>
      }
    />
  );
}
