import { useMemo, useState } from "react";
import { TOLLYWOOD_GIFS } from "@chit/shared";
import { api } from "../socket";

type Props = {
  open: boolean;
  onToggle: () => void;
};

/** Picker only — reactions pop on the main screen, not stored in a feed. */
export function GifChat({ open, onToggle }: Props) {
  const [filter, setFilter] = useState("");
  const gifs = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return TOLLYWOOD_GIFS;
    return TOLLYWOOD_GIFS.filter((g) => g.label.toLowerCase().includes(q));
  }, [filter]);

  return (
    <aside className={`gifchat ${open ? "gifchat--open" : ""}`}>
      <button type="button" className="gifchat__toggle" onClick={onToggle}>
        {open ? "Close reactions" : "Tollywood GIFs"}
      </button>
      {open && (
        <div className="gifchat__panel">
          <p className="gifchat__hint">
            Telugu reactions from{" "}
            <a href="https://tenor.com/search/telugu-gifs" target="_blank" rel="noreferrer">
              Tenor
            </a>{" "}
            — tap to pop on the table.
          </p>
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
                onClick={() => {
                  api.sendGif(g.id);
                  onToggle();
                }}
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
