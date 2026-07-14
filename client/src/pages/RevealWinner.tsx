import type { PublicRoom } from "@chit/shared";
import { api } from "../socket";
import { ChitCard } from "../components/ChitCard";

type Props = { room: PublicRoom };

export function RevealWinner({ room }: Props) {
  const winner = room.players.find((p) => p.id === room.winnerId);
  const isHost = room.hostId === room.youPlayerId;

  return (
    <section className="panel reveal">
      <p className="eyebrow">Winner</p>
      <h2 className="title">{winner?.nickname ?? "Someone"} wins!</h2>
      <p className="lede">All four chits match — revealed for the room.</p>
      <div className="chit-grid">
        {(room.winnerChits ?? []).map((chit) => (
          <ChitCard key={chit.id} chit={chit} />
        ))}
      </div>
      {isHost ? (
        <button type="button" className="btn btn--primary" onClick={() => api.playAgain()}>
          Play again
        </button>
      ) : (
        <p className="muted">Waiting for host to start another round…</p>
      )}
    </section>
  );
}
