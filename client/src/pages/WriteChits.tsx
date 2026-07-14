import { useState } from "react";
import type { PublicRoom } from "@chit/shared";
import { CHITS_PER_PLAYER } from "@chit/shared";
import { api } from "../socket";

type Props = { room: PublicRoom };

export function WriteChits({ room }: Props) {
  const you = room.players.find((p) => p.id === room.youPlayerId);
  const [text, setText] = useState("");
  const submitted = you?.hasSubmittedChits ?? false;
  const ready = text.trim().length > 0;

  return (
    <section className="panel">
      <p className="eyebrow">Writing</p>
      <h2 className="title">Write your chit</h2>
      <p className="lede">
        Enter one word or phrase. It is copied onto all {CHITS_PER_PLAYER} of your folded chits.
      </p>

      {submitted ? (
        <p className="status">Submitted. Waiting for others…</p>
      ) : (
        <>
          <label className="field">
            <span>Your chit text</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={40}
              placeholder="e.g. mango"
            />
          </label>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!ready}
            onClick={() => api.submitChitText(text.trim())}
          >
            Fold & submit ({CHITS_PER_PLAYER} chits)
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
