import type { Card, PublicRummyRoom } from "@chit/shared";
import { cardLabel, isRedSuit } from "@chit/shared";
import { api } from "../../socket";

type Props = { room: PublicRummyRoom };

function PlayingCard({ card, onClick, selected }: { card: Card; onClick?: () => void; selected?: boolean }) {
  const red = isRedSuit(card.suit);
  return (
    <button
      type="button"
      className={`rummy-card ${red ? "rummy-card--red" : "rummy-card--black"} ${selected ? "rummy-card--selected" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      {cardLabel(card)}
    </button>
  );
}

export function RummyWaiting({ room }: Props) {
  const connected = room.players.filter((p) => p.connected);
  const isHost = room.youPlayerId === room.hostId;

  return (
    <section className="panel rummy-panel">
      <p className="eyebrow">Room {room.code}</p>
      <h2 className="title">Royal Rummy</h2>
      <p className="lede">
        Green felt table — draw, discard, declare when your hand is all sets or runs.
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
          Deal cards
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
        <p className="lede">{winner?.nickname} declared a valid hand.</p>
        {room.youPlayerId === room.hostId && (
          <button type="button" className="btn btn--primary" onClick={() => api.playAgain()}>
            New round
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="panel rummy-panel rummy-play">
      <div className="rummy-top">
        <div>
          <p className="eyebrow">Room {room.code}</p>
          <h2 className="title">Royal Rummy</h2>
        </div>
        <p className="rummy-turn">
          {isYourTurn ? "Your turn" : `${room.players.find((p) => p.id === room.currentTurnPlayerId)?.nickname ?? "…"}'s turn`}
        </p>
      </div>

      <div className="rummy-table">
        <div className="rummy-pile">
          <p className="subtitle">Deck</p>
          <button
            type="button"
            className="rummy-deck"
            disabled={!isYourTurn || room.mustDiscard}
            onClick={() => api.rummyDrawDeck()}
          >
            <span>{room.deckCount}</span>
          </button>
        </div>
        <div className="rummy-pile">
          <p className="subtitle">Discard</p>
          {room.discardTop ? (
            <PlayingCard
              card={room.discardTop}
              onClick={isYourTurn && !room.mustDiscard ? () => api.rummyDrawDiscard() : undefined}
            />
          ) : (
            <div className="rummy-empty">—</div>
          )}
        </div>
      </div>

      <div className="rummy-hand">
        <p className="subtitle">Your hand ({hand.length})</p>
        <div className="rummy-hand__cards">
          {hand.map((c) => (
            <PlayingCard
              key={c.id}
              card={c}
              onClick={
                isYourTurn && room.mustDiscard ? () => api.rummyDiscard(c.id) : undefined
              }
            />
          ))}
        </div>
      </div>

      {isYourTurn && room.mustDiscard && (
        <div className="actions">
          <button type="button" className="btn btn--accent" onClick={() => api.rummyDeclare()}>
            Declare win
          </button>
          <p className="hint">Tap a card to discard, or declare if all cards form sets/runs.</p>
        </div>
      )}
    </section>
  );
}
