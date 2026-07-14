import { useCallback, useEffect, useState } from "react";
import { GIF_CATEGORIES, type GifSearchItem } from "@chit/shared";
import { TOLLYWOOD_GIFS } from "@chit/shared";
import { api, apiBase } from "../socket";

type Props = {
  open: boolean;
  onToggle: () => void;
};

export function GifChat({ open, onToggle }: Props) {
  const [category, setCategory] = useState(GIF_CATEGORIES[0]?.id ?? "telugu");
  const [filter, setFilter] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<GifSearchItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(filter.trim()), 350);
    return () => window.clearTimeout(t);
  }, [filter]);

  const load = useCallback(
    async (opts: { append?: boolean; pos?: string | null } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debounced) params.set("q", debounced);
        else params.set("category", category);
        if (opts.pos) params.set("pos", opts.pos);
        const res = await fetch(`${apiBase}/api/gifs/search?${params.toString()}`);
        const data = (await res.json()) as {
          items?: GifSearchItem[];
          next?: string | null;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Search failed");
        const list = data.items ?? [];
        setItems((prev) => (opts.append ? [...prev, ...list] : list));
        setNext(data.next ?? null);
      } catch (e) {
        // Offline / API failure — still show curated Telugu pack when not appending
        if (!opts.append) {
          const q = debounced.toLowerCase();
          const curated = TOLLYWOOD_GIFS.filter(
            (g) => !q || g.label.toLowerCase().includes(q) || category === "telugu"
          ).map((g) => ({
            id: g.id,
            label: g.label,
            gifUrl: g.gifUrl,
            previewUrl: g.gifUrl,
          }));
          setItems(curated);
          setNext(null);
          setError(e instanceof Error ? e.message : "Using saved Telugu GIFs");
        } else {
          setError(e instanceof Error ? e.message : "Load more failed");
        }
      } finally {
        setLoading(false);
      }
    },
    [category, debounced]
  );

  useEffect(() => {
    if (!open) return;
    void load({ append: false });
  }, [open, category, debounced, load]);

  return (
    <aside className={`gifchat ${open ? "gifchat--open" : ""}`}>
      <button type="button" className="gifchat__toggle" onClick={onToggle}>
        {open ? "Close reactions" : "GIF reactions"}
      </button>
      {open && (
        <div className="gifchat__panel">
          <p className="gifchat__hint">
            Search Tenor’s library (Telugu + world). GIF pops at your seat.
          </p>
          <div className="gifchat__cats">
            {GIF_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`gifchat__cat ${category === c.id && !debounced ? "gifchat__cat--on" : ""}`}
                onClick={() => {
                  setFilter("");
                  setCategory(c.id);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <input
            className="gifchat__search"
            placeholder="Search any GIF (e.g. mahesh babu, laugh, dance)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {error && <p className="gifchat__status">{error}</p>}
          {loading && items.length === 0 && <p className="gifchat__status">Loading…</p>}
          <div className="gifchat__grid">
            {items.map((g) => (
              <button
                key={`${g.id}-${g.gifUrl}`}
                type="button"
                className="gifchat__pick"
                title={g.label}
                onClick={() => {
                  api.sendGif({ gifId: g.id, gifUrl: g.gifUrl, label: g.label });
                  onToggle();
                }}
              >
                <img src={g.previewUrl || g.gifUrl} alt={g.label} loading="lazy" />
                <span>{g.label}</span>
              </button>
            ))}
          </div>
          {next && (
            <button
              type="button"
              className="btn btn--ghost gifchat__more"
              disabled={loading}
              onClick={() => void load({ append: true, pos: next })}
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
