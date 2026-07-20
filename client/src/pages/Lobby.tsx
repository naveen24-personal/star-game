import { useState } from "react";
import type { GameId } from "@chit/shared";
import { GAME_CATALOG } from "@chit/shared";
import { api } from "../socket";

type Props = {
  gameId: GameId;
  onBack: () => void;
};

export function Lobby({ gameId, onBack }: Props) {
  const game = GAME_CATALOG[gameId];
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"home" | "join">("home");

  return (
    <section className="panel lobby">
      <button type="button" className="btn btn--ghost btn--back" onClick={onBack}>
        ← All games
      </button>
      <p className="eyebrow">{game.emoji} Online multiplayer</p>
      <h1 className="brand">{game.name}</h1>
      <p className="lede">{game.tagline}</p>

      <label className="field">
        <span>Nickname</span>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Your name"
          maxLength={24}
        />
      </label>

      {mode === "home" ? (
        <div className="actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={!nickname.trim()}
            onClick={() => api.create(nickname.trim(), gameId)}
          >
            Create room
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setMode("join")}>
            Join with code
          </button>
        </div>
      ) : (
        <div className="join">
          <label className="field">
            <span>Room code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={8}
            />
          </label>
          <div className="actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!nickname.trim() || code.trim().length < 4}
              onClick={() => api.join(code.trim(), nickname.trim(), gameId)}
            >
              Join room
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setMode("home")}>
              Back
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
