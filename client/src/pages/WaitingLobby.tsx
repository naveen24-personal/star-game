import type { PublicRoom } from "@chit/shared";
import { api } from "../socket";

type Props = { room: PublicRoom };

export function WaitingLobby({ room }: Props) {
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const isHost = room.hostId === room.youPlayerId;
  const canStart =
    room.players.filter((p) => p.connected).length >= room.minPlayers &&
    room.players.filter((p) => p.connected).length <= room.maxPlayers;

  return (
    <section className="panel">
      <p className="eyebrow">Room</p>
      <h2 className="title">{room.code}</h2>
      <p className="lede">Share this code with friends. Need {room.minPlayers}–{room.maxPlayers} players.</p>

      <ul className="player-list">
        {room.players.map((p, i) => {
          const right = room.players[(i + 1) % room.players.length];
          return (
            <li key={p.id} className={p.id === room.youPlayerId ? "you" : ""}>
              <strong>{p.nickname}</strong>
              {p.id === room.hostId ? " · host/thrower" : ""}
              {p.id === room.youPlayerId ? " · you" : ""}
              <span className="muted"> → right: {right?.nickname}</span>
            </li>
          );
        })}
      </ul>

      {isHost ? (
        <button
          type="button"
          className="btn btn--primary"
          disabled={!canStart}
          onClick={() => api.start()}
        >
          Start game
        </button>
      ) : (
        <p className="muted">Waiting for {you ? "host" : "host"} to start…</p>
      )}
    </section>
  );
}
