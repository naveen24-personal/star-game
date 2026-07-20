import type { PublicBingoRoom } from "@chit/shared";
import { BINGO_COLUMNS } from "@chit/shared";
import { api } from "../socket";

type Props = { room: PublicBingoRoom };

function letterForNumber(n: number): string {
  for (const col of BINGO_COLUMNS) {
    if (n >= col.min && n <= col.max) return col.letter;
  }
  return "?";
}

export function BingoWaiting({ room }: Props) {
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const connected = room.players.filter((p) => p.connected);
  const isHost = room.youPlayerId === room.hostId;

  return (
    <section className="panel bingo-panel">
      <p className="eyebrow">Room {room.code}</p>
      <h2 className="title">Bingo Hall</h2>
      <p className="lede">
        Waiting for players ({connected.length}/{room.maxPlayers}). Host calls numbers — mark your card
        and shout BINGO!
      </p>
      <ul className="player-list">
        {room.players
          .filter((p) => p.connected)
          .map((p) => (
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
          Start game
        </button>
      )}
      {!isHost && <p className="hint">Waiting for {you?.nickname === room.players.find((x) => x.id === room.hostId)?.nickname ? "players" : "host"}…</p>}
    </section>
  );
}

export function BingoPlay({ room }: Props) {
  const isHost = room.youPlayerId === room.hostId;
  const board = room.yourBoard;
  const winner = room.players.find((p) => p.id === room.winnerId);

  if (room.phase === "won") {
    return (
      <section className="panel bingo-panel bingo-win">
        <h2 className="title">BINGO!</h2>
        <p className="lede">{winner?.nickname ?? "Someone"} wins the hall!</p>
        {isHost && (
          <button type="button" className="btn btn--primary" onClick={() => api.playAgain()}>
            Play again
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="panel bingo-panel bingo-play">
      <div className="bingo-header">
        <div>
          <p className="eyebrow">Room {room.code}</p>
          <h2 className="title">Bingo Hall</h2>
        </div>
        {room.currentCall != null && (
          <div className="bingo-call" aria-live="polite">
            <span className="bingo-call__letter">{letterForNumber(room.currentCall)}</span>
            <span className="bingo-call__num">{room.currentCall}</span>
          </div>
        )}
      </div>

      {board && (
        <div className="bingo-board-wrap">
          <div className="bingo-letters">
            {BINGO_COLUMNS.map((c) => (
              <span key={c.letter}>{c.letter}</span>
            ))}
          </div>
          <div className="bingo-board">
            {board.map((row, ri) =>
              row.map((cell, ci) => (
                <div
                  key={`${ri}-${ci}`}
                  className={`bingo-cell ${cell.marked ? "bingo-cell--marked" : ""} ${cell.number == null ? "bingo-cell--free" : ""}`}
                >
                  {cell.number == null ? "FREE" : cell.number}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="bingo-called">
        <p className="subtitle">Called ({room.calledNumbers.length})</p>
        <div className="bingo-called__nums">
          {[...room.calledNumbers].reverse().slice(0, 12).map((n) => (
            <span key={n} className="bingo-chip">
              {letterForNumber(n)}
              {n}
            </span>
          ))}
        </div>
      </div>

      <div className="actions bingo-actions">
        {isHost && (
          <button type="button" className="btn btn--primary" onClick={() => api.bingoCall()}>
            Call next number
          </button>
        )}
        <button type="button" className="btn btn--accent" onClick={() => api.bingoClaim()}>
          BINGO!
        </button>
      </div>
    </section>
  );
}
