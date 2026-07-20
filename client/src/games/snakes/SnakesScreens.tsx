import type { PublicSnakesRoom } from "@chit/shared";
import { LADDERS, SNAKES, SNAKES_WIN } from "@chit/shared";
import { api } from "../../socket";

type Props = { room: PublicSnakesRoom };

/** Serpentine board: row 0 L→R, row 1 R→L, … */
function cellNumber(row: number, col: number): number {
  const base = row * 10;
  if (row % 2 === 0) return base + col + 1;
  return base + (10 - col);
}

function cellPos(n: number): { row: number; col: number } {
  const row = Math.floor((n - 1) / 10);
  const offset = (n - 1) % 10;
  const col = row % 2 === 0 ? offset : 9 - offset;
  return { row, col };
}

export function SnakesWaiting({ room }: Props) {
  const connected = room.players.filter((p) => p.connected);
  const isHost = room.youPlayerId === room.hostId;

  return (
    <section className="panel snakes-panel">
      <p className="eyebrow">Room {room.code}</p>
      <h2 className="title">Snakes & Ladders</h2>
      <p className="lede">Roll the dice, race to 100 — ladders up, snakes down!</p>
      <ul className="player-list">
        {connected.map((p) => (
          <li key={p.id}>
            {p.nickname}
            {p.id === room.hostId ? " · host" : ""}
            {p.id === room.youPlayerId ? " · you" : ""}
          </li>
        ))}
      </ul>
      {isHost && (
        <button
          type="button"
          className="btn btn--primary"
          disabled={connected.length < room.minPlayers}
          onClick={() => api.start()}
        >
          Start race
        </button>
      )}
    </section>
  );
}

export function SnakesPlay({ room }: Props) {
  const isYourTurn = room.currentTurnPlayerId === room.youPlayerId;
  const winner = room.players.find((p) => p.id === room.winnerId);
  const roll = room.lastRoll;

  if (room.phase === "won") {
    return (
      <section className="panel snakes-panel snakes-win">
        <h2 className="title">Winner!</h2>
        <p className="lede">{winner?.nickname} reached square {SNAKES_WIN}!</p>
        {room.youPlayerId === room.hostId && (
          <button type="button" className="btn btn--primary" onClick={() => api.playAgain()}>
            Play again
          </button>
        )}
      </section>
    );
  }

  const tokens = room.players.filter((p) => p.connected && p.position > 0);
  const byCell = new Map<number, typeof tokens>();
  for (const p of tokens) {
    const list = byCell.get(p.position) ?? [];
    list.push(p);
    byCell.set(p.position, list);
  }

  return (
    <section className="panel snakes-panel snakes-play shell--wide">
      <div className="snakes-header">
        <div>
          <p className="eyebrow">Room {room.code}</p>
          <h2 className="title">Snakes & Ladders</h2>
        </div>
        {roll && (
          <div className={`snakes-roll snakes-roll--${roll.kind}`}>
            <span className="snakes-roll__dice">{roll.value}</span>
            <span className="snakes-roll__text">
              {room.players.find((p) => p.id === roll.playerId)?.nickname} → {roll.final}
              {roll.kind === "snake" ? " 🐍" : roll.kind === "ladder" ? " 🪜" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="snakes-board-wrap">
        <div className="snakes-board">
          {Array.from({ length: 10 }, (_, row) =>
            Array.from({ length: 10 }, (_, col) => {
              const n = cellNumber(9 - row, col);
              const isLadder = LADDERS[n];
              const isSnake = SNAKES[n];
              const occupants = byCell.get(n) ?? [];
              return (
                <div
                  key={n}
                  className={`snakes-cell ${isLadder ? "snakes-cell--ladder" : ""} ${isSnake ? "snakes-cell--snake" : ""} ${n === SNAKES_WIN ? "snakes-cell--goal" : ""}`}
                >
                  <span className="snakes-cell__num">{n}</span>
                  <span className="snakes-cell__tokens">
                    {occupants.map((p) => (
                      <span
                        key={p.id}
                        className={`snakes-token ${p.id === room.youPlayerId ? "snakes-token--you" : ""}`}
                        title={p.nickname}
                      >
                        {p.nickname.slice(0, 1)}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ul className="snakes-scores">
        {room.players
          .filter((p) => p.connected)
          .map((p) => (
            <li key={p.id} className={p.id === room.currentTurnPlayerId ? "snakes-scores--active" : ""}>
              {p.nickname}: {p.position}
              {p.id === room.youPlayerId ? " (you)" : ""}
            </li>
          ))}
      </ul>

      {isYourTurn ? (
        <button type="button" className="btn btn--primary btn--dice" onClick={() => api.snakesRoll()}>
          Roll dice 🎲
        </button>
      ) : (
        <p className="hint">
          Waiting for {room.players.find((p) => p.id === room.currentTurnPlayerId)?.nickname}…
        </p>
      )}
    </section>
  );
}

/** Export for tests / overlays */
export { cellPos };
