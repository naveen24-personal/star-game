import { useEffect, useRef, useState } from "react";
import type { PublicSnakesRoom, SnakesRollEvent } from "@chit/shared";
import { api } from "../../socket";
import { SnakesBoardSheet } from "./SnakesBoardSheet";
import { Dice3D, DiceColorPicker, type DiceColor } from "./Dice3D";
import { LadderClimbFX, SnakeBiteFX } from "./SnakeBiteFX";
import { cellPos } from "./boardLayout";

export { cellPos };

const DICE_COLOR_KEY = "snakesDiceColor";

type Props = { room: PublicSnakesRoom };

type FxState = { type: "snake" | "ladder"; roll: SnakesRollEvent } | null;

function loadDiceColor(): DiceColor {
  try {
    const v = localStorage.getItem(DICE_COLOR_KEY);
    if (v === "white" || v === "red" || v === "black") return v;
  } catch {
    /* ignore */
  }
  return "white";
}

export function SnakesWaiting({ room }: Props) {
  const connected = room.players.filter((p) => p.connected);
  const isHost = room.youPlayerId === room.hostId;

  return (
    <section className="panel snakes-panel">
      <p className="eyebrow">Room {room.code}</p>
      <h2 className="title">Snakes & Ladders</h2>
      <p className="lede">Full-board chaos — tap the 3D dice, dodge snakes, race to HOME!</p>
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
  const [diceColor, setDiceColor] = useState<DiceColor>(loadDiceColor);
  const [fx, setFx] = useState<FxState>(null);
  const [biteHead, setBiteHead] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<{ from: number; to: number } | null>(null);
  const rollKeyRef = useRef("");

  useEffect(() => {
    try {
      localStorage.setItem(DICE_COLOR_KEY, diceColor);
    } catch {
      /* ignore */
    }
  }, [diceColor]);

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

      if (r.kind === "snake") {
        setFx({ type: "snake", roll: r });
        setBiteHead(r.to);
        window.setTimeout(() => setBiteHead(null), 2400);
      } else if (r.kind === "ladder") {
        setFx({ type: "ladder", roll: r });
      }

      window.setTimeout(() => setHighlight(null), 2200);
    }, 1400);

    return () => window.clearTimeout(reveal);
  }, [room.lastRoll]);

  useEffect(() => {
    if (!fx) return;
    const t = window.setTimeout(() => setFx(null), 2600);
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
        <p className="lede">{winner?.nickname} reached HOME!</p>
        <Dice3D value={6} rolling={false} color={diceColor} />
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
    <div className="snakes-arena">
      {fx?.type === "snake" && (
        <SnakeBiteFX
          roll={fx.roll}
          playerName={room.players.find((p) => p.id === fx.roll.playerId)?.nickname ?? "Player"}
        />
      )}
      {fx?.type === "ladder" && (
        <LadderClimbFX
          roll={fx.roll}
          playerName={room.players.find((p) => p.id === fx.roll.playerId)?.nickname ?? "Player"}
        />
      )}

      <div className="snakes-arena__main">
        <header className="snakes-hud">
          <div>
            <span className="snakes-hud__code">#{room.code}</span>
            <span className="snakes-hud__title">Snakes & Ladders</span>
          </div>
          {roll && rollPlayer && (
            <p className={`snakes-hud__roll snakes-hud__roll--${roll.kind}`}>
              <strong>{rollPlayer.nickname}</strong> rolled {roll.value}
              {roll.kind === "snake" && ` · bitten → ${roll.final}`}
              {roll.kind === "ladder" && ` · climbed → ${roll.final}`}
            </p>
          )}
        </header>

        <SnakesBoardSheet
          players={room.players}
          youPlayerId={room.youPlayerId}
          currentTurnPlayerId={room.currentTurnPlayerId}
          highlightFrom={highlight?.from ?? null}
          highlightTo={highlight?.to ?? null}
          biteHead={biteHead}
        />

        <footer className="snakes-hud snakes-hud--scores">
          {room.players
            .filter((p) => p.connected)
            .map((p) => (
              <span
                key={p.id}
                className={`snakes-hud__chip ${p.id === room.currentTurnPlayerId ? "snakes-hud__chip--on" : ""}`}
              >
                {p.nickname}: {p.position}
                {p.id === room.youPlayerId ? " (you)" : ""}
              </span>
            ))}
        </footer>
      </div>

      <aside className="snakes-dice-rail">
        <p className="snakes-dice-rail__label">
          {isYourTurn ? "Your turn" : `Waiting for ${room.players.find((p) => p.id === room.currentTurnPlayerId)?.nickname ?? "…"}`}
        </p>
        <Dice3D
          value={diceValue ?? roll?.value ?? null}
          rolling={diceRolling}
          color={diceColor}
          onClick={isYourTurn ? handleRoll : undefined}
          disabled={diceRolling || !isYourTurn}
        />
        <DiceColorPicker color={diceColor} onChange={setDiceColor} />
        <p className="snakes-dice-rail__hint">Pick red · black · white dice</p>
      </aside>
    </div>
  );
}
