import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Card, PublicRummyPlayer, PublicRummyRoom } from "@chit/shared";
import { opponentPosition, seatPosition, seatsForGeneric } from "../../seatLayout";
import { PlayingCard, CardStack } from "./PlayingCard";

type Props = {
  room: PublicRummyRoom;
  centerContent?: ReactNode;
  myHand?: ReactNode;
  banner?: ReactNode;
  canDraw?: boolean;
  onDrawDeck?: () => void;
  onDrawDiscard?: () => void;
};

function fanAlign(leftPct: number): "left" | "center" | "right" {
  if (leftPct < 28) return "left";
  if (leftPct > 72) return "right";
  return "center";
}

function OppFan({ count, align }: { count: number; align: "left" | "center" | "right" }) {
  const n = Math.min(Math.max(count, 0), 13);
  return (
    <div className={`rummy-fan rummy-fan--${align}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const mid = (n - 1) / 2;
        const offset = i - mid;
        return (
          <span
            key={i}
            className="rummy-fan__card"
            style={{
              transform: `translateX(${offset * 10}px) rotate(${offset * 6}deg)`,
              zIndex: i,
            }}
          />
        );
      })}
    </div>
  );
}

export function RummyTable({ room, centerContent, myHand, banner, canDraw, onDrawDeck, onDrawDiscard }: Props) {
  const seats = seatsForGeneric(room.players, room.youPlayerId);
  const opponents = seats.filter((p) => p.id !== room.youPlayerId);
  const [flightKey, setFlightKey] = useState<string | null>(null);

  useEffect(() => {
    const ev = room.lastCardEvent;
    if (!ev) return;
    const key = `${ev.kind}:${ev.cardId}:${ev.playerId}`;
    setFlightKey(key);
    const t = window.setTimeout(() => setFlightKey(null), 780);
    return () => window.clearTimeout(t);
  }, [room.lastCardEvent?.kind, room.lastCardEvent?.cardId, room.lastCardEvent?.playerId]);

  const cardFlight = (() => {
    if (!flightKey || !room.lastCardEvent) return null;
    const ev = room.lastCardEvent;
    const playerIdx = seats.findIndex((s) => s.id === ev.playerId);
    if (playerIdx < 0) return null;
    const fromSeat = seatPosition(playerIdx, seats.length);
    const center = { left: 50, top: 46 };
    let from = fromSeat;
    let to = center;
    if (ev.kind === "discard") {
      from = fromSeat;
      to = center;
    } else if (ev.kind === "draw-deck") {
      from = { left: 38, top: 46 };
      to = fromSeat;
    } else {
      from = center;
      to = fromSeat;
    }
    const card: Card = { id: ev.cardId, suit: ev.suit, rank: ev.rank };
    return { from, to, key: flightKey, card };
  })();

  return (
    <section className="rummy-stage" aria-label="Rummy table">
      <div className="rummy-stage__glow" aria-hidden />

      <div className="rummy-table-arena">
        {opponents.map((p, i) => {
          const pos = opponentPosition(i, opponents.length);
          const isTurn = p.id === room.currentTurnPlayerId;
          const align = fanAlign(pos.left);
          return (
            <div
              key={p.id}
              className={`rummy-opp ${isTurn ? "rummy-opp--turn" : ""}`}
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            >
              <OppFan count={p.handCount} align={align} />
              <div className="rummy-badge">
                <div className="rummy-badge__avatar">{p.nickname.slice(0, 1).toUpperCase()}</div>
                <div className="rummy-badge__meta">
                  <span className="rummy-badge__name">{p.nickname}</span>
                  <span className="rummy-badge__count">
                    {p.handCount} cards{p.id === room.hostId ? " · host" : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="rummy-center">
          <div className="rummy-piles">
            <div className="rummy-pile rummy-pile--deck">
              <button
                type="button"
                className="rummy-pile__btn"
                disabled={!canDraw}
                onClick={onDrawDeck}
                title="Draw from deck"
              >
                <CardStack count={room.deckCount} size="md" />
              </button>
              <span className="rummy-pile__count">{room.deckCount}</span>
            </div>
            <div className="rummy-pile rummy-pile--discard">
              {room.discardTop ? (
                <button
                  type="button"
                  className="rummy-pile__btn"
                  disabled={!canDraw}
                  onClick={onDrawDiscard}
                  title="Take discard"
                >
                  <PlayingCard card={room.discardTop} size="md" />
                </button>
              ) : (
                <div className="rummy-pile__empty" />
              )}
            </div>
          </div>
          {centerContent}
          {banner && <div className="rummy-banner">{banner}</div>}
        </div>

        {cardFlight && (
          <div
            key={cardFlight.key}
            className="card-flight"
            style={
              {
                ["--x0" as string]: `${cardFlight.from.left}%`,
                ["--y0" as string]: `${cardFlight.from.top}%`,
                ["--x1" as string]: `${cardFlight.to.left}%`,
                ["--y1" as string]: `${cardFlight.to.top}%`,
              } as CSSProperties
            }
            aria-hidden
          >
            <PlayingCard card={cardFlight.card} size="sm" className="card-flight__card" />
          </div>
        )}

        <div className="rummy-me">{myHand}</div>
      </div>
    </section>
  );
}

export type { PublicRummyPlayer };
