import { useEffect, useRef, useState } from "react";
import type { PublicSnakesRoom, SnakesRollEvent } from "@chit/shared";
import { SNAKES_WIN } from "@chit/shared";
import { api } from "../../socket";
import { SnakesBoard3D } from "./SnakesBoard3D";
import { Dice3D } from "./Dice3D";
import { LadderClimbFX, SnakeBiteFX } from "./SnakeBiteFX";
import { cellPos } from "./boardLayout";

export { cellPos };

type Props = { room: PublicSnakesRoom };

type FxState = { type: "snake" | "ladder"; roll: SnakesRollEvent } | null;

export function SnakesWaiting({ room }: Props) {
  const connected = room.players.filter((p) => p.connected);
  const isHost = room.youPlayerId === room.hostId;

  return (
    <section className="panel snakes-panel">
      <p className="eyebrow">Room {room.code}</p>
      <h2 className="title">Snakes & Ladders</h2>
      <p className="lede">Roll the 3D dice, dodge snakes, climb ladders — first to 100 wins!</p>
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

  const [diceRolling, setDiceRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [fx, setFx] = useState<FxState>(null);
  const [highlight, setHighlight] = useState<{ from: number; to: number } | null>(null);
  const rollKeyRef = useRef("");

  useEffect(() => {
    const r = room.lastRoll;
    if (!r) return;
    const key = `${r.playerId}-${r.value}-${r.from}-${r.to}-${r.final}-${r.kind}`;
    if (key === rollKeyRef.current) return;
    rollKeyRef.current = key;

    setDiceRolling(true);
    setDiceValue(null);

    const reveal = window.setTimeout(() => {
      setDiceRolling(false);
      setDiceValue(r.value);
      setHighlight({ from: r.to, to: r.final });

      if (r.kind === "snake") setFx({ type: "snake", roll: r });
      else if (r.kind === "ladder") setFx({ type: "ladder", roll: r });

      window.setTimeout(() => setHighlight(null), 2200);
    }, 1300);

    return () => window.clearTimeout(reveal);
  }, [room.lastRoll]);

  useEffect(() => {
    if (!fx) return;
    const t = window.setTimeout(() => setFx(null), 2800);
    return () => window.clearTimeout(t);
  }, [fx]);

  const handleRoll = () => {
    if (diceRolling || !isYourTurn) return;
    setDiceRolling(true);
    setDiceValue(null);
    api.snakesRoll();
  };

  if (room.phase === "won") {
    return (
      <section className="panel snakes-panel snakes-win">
        <div className="snakes-win__burst" aria-hidden />
        <h2 className="title">Winner!</h2>
        <p className="lede">{winner?.nickname} reached square {SNAKES_WIN}!</p>
        <Dice3D value={6} rolling={false} size="lg" />
        {room.youPlayerId === room.hostId && (
          <button type="button" className="btn btn--primary" onClick={() => api.playAgain()}>
            Play again
          </button>
        )}
      </section>
    );
  }

  const rollPlayer = roll ? room.players.find((p) => p.id === roll.playerId) : null;

  return (
    <section className="panel snakes-panel snakes-play">
      {fx?.type === "snake" && (
        <SnakeBiteFX
          roll={fx.roll}
          playerName={room.players.find((p) => p.id === fx.roll.playerId)?.nickname ?? "Player"}
          onDone={() => setFx(null)}
        />
      )}
      {fx?.type === "ladder" && (
        <LadderClimbFX
          roll={fx.roll}
          playerName={room.players.find((p) => p.id === fx.roll.playerId)?.nickname ?? "Player"}
          onDone={() => setFx(null)}
        />
      )}

      <div className="snakes-header">
        <div>
          <p className="eyebrow">Room {room.code}</p>
          <h2 className="title">Snakes & Ladders</h2>
        </div>
        {roll && rollPlayer && (
          <div className={`snakes-roll snakes-roll--${roll.kind}`}>
            <Dice3D value={diceValue ?? roll.value} rolling={diceRolling} size="sm" />
            <span className="snakes-roll__text">
              <strong>{rollPlayer.nickname}</strong> rolled {roll.value}
              {roll.kind === "snake" && ` — bitten! → ${roll.final}`}
              {roll.kind === "ladder" && ` — climbed! → ${roll.final}`}
              {roll.kind === "normal" && roll.final !== roll.from + roll.value && ` → ${roll.final}`}
              {roll.kind === "normal" && roll.final === roll.from && roll.to === roll.from && " — stay put"}
            </span>
          </div>
        )}
      </div>

      <SnakesBoard3D
        players={room.players}
        youPlayerId={room.youPlayerId}
        highlightFrom={highlight?.from ?? null}
        highlightTo={highlight?.to ?? null}
      />

      <ul className="snakes-scores">
        {room.players
          .filter((p) => p.connected)
          .map((p) => (
            <li key={p.id} className={p.id === room.currentTurnPlayerId ? "snakes-scores--active" : ""}>
              <span className="snakes-scores__dot" style={{ background: `var(--token-${p.seat % 8})` }} />
              {p.nickname}: {p.position}
              {p.id === room.youPlayerId ? " (you)" : ""}
            </li>
          ))}
      </ul>

      <div className="snakes-controls">
        <Dice3D value={diceValue} rolling={diceRolling && isYourTurn} size="lg" />
        {isYourTurn ? (
          <button
            type="button"
            className="btn btn--primary btn--dice"
            disabled={diceRolling}
            onClick={handleRoll}
          >
            {diceRolling ? "Rolling…" : "Roll dice"}
          </button>
        ) : (
          <p className="hint">
            Waiting for {room.players.find((p) => p.id === room.currentTurnPlayerId)?.nickname}…
          </p>
        )}
      </div>
    </section>
  );
}
