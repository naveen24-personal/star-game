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
          <div className="club-ready">
            <div className="club-ready__stack" aria-hidden>
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="club-ready__reflect" aria-hidden />
          </div>
        }
        banner={
          <div className="uno-banner__inner">
            <p className="uno-banner__title">Clubbed</p>
            <p className="uno-banner__sub">
              {isThrower ? "Throw the pile onto the table" : "Waiting for thrower…"}
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
        myHand={
          <div className="my-hand my-hand--waiting">
            <p className="my-hand__hint">Your hand appears here after you pick</p>
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
        p.hasPicked ? "done" : `${p.handCount}/${CHITS_PER_PLAYER}`
      }
      tableTop={
        <ScatteredPool
          chits={room.pool}
          faceDown
          thrown
          disabled={locked || claimed >= CHITS_PER_PLAYER}
          onClaim={(id) => api.claim(id)}
        />
      }
      banner={
        locked ? (
          <div className="uno-banner__inner">
            <p className="uno-banner__title">Locked {CHITS_PER_PLAYER}</p>
            <p className="uno-banner__sub">Waiting for everyone…</p>
          </div>
        ) : (
          <div className="uno-banner__inner uno-banner__inner--subtle">
            <p className="uno-banner__sub">
              Tap a folded chit on the table · {claimed}/{CHITS_PER_PLAYER}
            </p>
          </div>
        )
      }
      myHand={
        <div className="my-hand">
          <div className="my-hand__row">
            {hand.map((chit) => (
              <div key={chit.id} className="my-hand__card">
                <ChitCard
                  chit={chit}
                  unfold
                  selected
                  disabled={locked}
                  onClick={locked ? undefined : () => api.release(chit.id)}
                />
              </div>
            ))}
            {hand.length === 0 && (
              <p className="my-hand__hint">Pick from the messy pile in the center</p>
            )}
          </div>
        </div>
      }
    />
  );
}
