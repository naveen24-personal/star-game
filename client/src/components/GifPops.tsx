import type { ChatMessage } from "@chit/shared";
import { getGifById } from "@chit/shared";

export type GifPopItem = ChatMessage;

type Props = {
  pops: GifPopItem[];
  /** Fallback overlay when not on the round table */
  positions?: Record<string, { left: number; top: number }>;
};

/** Used outside the table arena (lobby / writing / reveal). */
export function GifPops({ pops, positions }: Props) {
  return (
    <div className="gif-pops" aria-live="polite">
      {pops.map((p) => {
        const gif = getGifById(p.gifId);
        const pos = positions?.[p.playerId] ?? { left: 50, top: 40 };
        return (
          <div
            key={p.id}
            className="gif-pop"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          >
            <span className="gif-pop__who">{p.nickname}</span>
            {gif ? (
              <img src={gif.gifUrl} alt={gif.label} />
            ) : (
              <span className="gif-pop__fallback">{p.gifId}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
