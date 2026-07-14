import { useState } from "react";
import { api } from "../socket";

export function Lobby() {
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"home" | "join">("home");

  return (
    <section className="panel lobby">
      <p className="eyebrow">Online party</p>
      <h1 className="brand">Chit Party</h1>
      <p className="lede">
        Write four chits, throw the pile, pick four, pass right — first with four matching wins.
      </p>

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
            onClick={() => api.create(nickname.trim())}
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
              onClick={() => api.join(code.trim(), nickname.trim())}
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
