import { useMemo, useState } from "react";
import type { ChatMessage } from "@chit/shared";
import { TOLLYWOOD_GIFS, getGifById } from "@chit/shared";
import { api } from "../socket";

type Props = {
  messages: ChatMessage[];
  open: boolean;
  onToggle: () => void;
};

export function GifChat({ messages, open, onToggle }: Props) {
  const [filter, setFilter] = useState("");
  const gifs = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return TOLLYWOOD_GIFS;
    return TOLLYWOOD_GIFS.filter((g) => g.label.toLowerCase().includes(q));
  }, [filter]);

  return (
    <aside className={`gifchat ${open ? "gifchat--open" : ""}`}>
      <button type="button" className="gifchat__toggle" onClick={onToggle}>
        {open ? "Hide reactions" : "Tollywood GIFs"}
      </button>
      {open && (
        <div className="gifchat__panel">
          <div className="gifchat__feed">
            {messages.length === 0 && <p className="muted">Send a Tollywood reaction…</p>}
            {messages.map((m) => {
              const gif = getGifById(m.gifId);
              return (
                <div key={m.id} className="gifchat__msg">
                  <span className="gifchat__who">{m.nickname}</span>
                  {gif ? (
                    <img src={gif.gifUrl} alt={gif.label} loading="lazy" />
                  ) : (
                    <span>{m.gifId}</span>
                  )}
                </div>
              );
            })}
          </div>
          <input
            className="gifchat__search"
            placeholder="Search reactions"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="gifchat__grid">
            {gifs.map((g) => (
              <button
                key={g.id}
                type="button"
                className="gifchat__pick"
                title={g.label}
                onClick={() => api.sendGif(g.id)}
              >
                <img src={g.gifUrl} alt={g.label} loading="lazy" />
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
