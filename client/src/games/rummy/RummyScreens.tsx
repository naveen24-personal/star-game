import type { PublicRummyRoom } from "@chit/shared";
import { RUMMY_HAND_SIZE } from "@chit/shared";
import { api } from "../../socket";
import { RummyTable } from "./RummyTable";
import { RummyHandBoard } from "./RummyHandBoard";

type Props = { room: PublicRummyRoom };

export function RummyWaiting({ room }: Props) {
  const connected = room.players.filter((p) => p.connected);
  const isHost = room.youPlayerId === room.hostId;

  return (
    <section className="panel rummy-panel">
      <p className="eyebrow">Room {room.code}</p>
      <h2 className="title">Royal Rummy</h2>
      <p className="lede">
        Round green table — 13 cards each, arrange as <strong>4 + 3 + 3 + 3</strong> sets or runs,
        draw, discard, declare to win.
      </p>
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
          Deal {RUMMY_HAND_SIZE} cards
        </button>
      )}
    </section>
  );
}

export function RummyPlay({ room }: Props) {
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const hand = you?.hand ?? [];
  const isYourTurn = room.currentTurnPlayerId === room.youPlayerId;
  const winner = room.players.find((p) => p.id === room.winnerId);

  if (room.phase === "won") {
    return (
      <section className="panel rummy-panel rummy-win">
        <h2 className="title">Royal win!</h2>
        <p className="lede">{winner?.nickname} declared a valid 4·3·3·3 hand.</p>
        {room.youPlayerId === room.hostId && (
          <button type="button" className="btn btn--primary" onClick={() => api.playAgain()}>
            New round
          </button>
        )}
      </section>
    );
  }

  const turnName = room.players.find((p) => p.id === room.currentTurnPlayerId)?.nickname ?? "…";

  return (
    <RummyTable
      room={room}
      canDraw={isYourTurn && !room.mustDiscard}
      onDrawDeck={() => api.rummyDrawDeck()}
      onDrawDiscard={() => api.rummyDrawDiscard()}
      banner={
        <span className="rummy-banner__text">
          {isYourTurn ? "Your turn — draw then discard" : `${turnName}'s turn`}
        </span>
      }
      centerContent={
        isYourTurn && !room.mustDiscard ? (
          <div className="rummy-draw-actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={() => api.rummyDrawDeck()}>
              Draw deck
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={!room.discardTop}
              onClick={() => api.rummyDrawDiscard()}
            >
              Take discard
            </button>
          </div>
        ) : null
      }
      myHand={
        <div className="rummy-me-panel">
          <RummyHandBoard
            hand={hand}
            canDiscard={isYourTurn && room.mustDiscard}
            onDiscard={(id) => api.rummyDiscard(id)}
          />
          {isYourTurn && room.mustDiscard && (
            <div className="rummy-me-actions">
              <button type="button" className="btn btn--accent" onClick={() => api.rummyDeclare()}>
                Declare (4·3·3·3)
              </button>
              <p className="hint">Tap a card to discard to the pile — watch it fly!</p>
            </div>
          )}
        </div>
      }
    />
  );
}
