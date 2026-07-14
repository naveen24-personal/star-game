import { useState } from "react";
import type { PublicRoom } from "@chit/shared";
import { CHITS_PER_PLAYER } from "@chit/shared";
import { api } from "../socket";

type Props = { room: PublicRoom };

export function WriteChits({ room }: Props) {
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const [texts, setTexts] = useState(["", "", "", ""]);
  const submitted = you?.hasSubmittedChits ?? false;

  const update = (i: number, v: string) => {
    setTexts((prev) => prev.map((t, idx) => (idx === i ? v : t)));
  };

  const ready = texts.every((t) => t.trim().length > 0);

  return (
    <section className="panel">
      <p className="eyebrow">Writing</p>
      <h2 className="title">Fold your {CHITS_PER_PLAYER} chits</h2>
      <p className="lede">Write anything — matching uses exact text (ignore case).</p>

      {submitted ? (
        <p className="status">Submitted. Waiting for others…</p>
      ) : (
        <>
          <div className="write-grid">
            {texts.map((t, i) => (
              <label key={i} className="field">
                <span>Chit {i + 1}</span>
                <input value={t} onChange={(e) => update(i, e.target.value)} maxLength={40} />
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!ready}
            onClick={() => api.submitChits(texts.map((t) => t.trim()))}
          >
            Fold & submit
          </button>
        </>
      )}

      <ul className="player-list compact">
        {room.players.map((p) => (
          <li key={p.id}>
            {p.nickname}: {p.hasSubmittedChits ? "ready" : "writing…"}
          </li>
        ))}
      </ul>
    </section>
  );
}
