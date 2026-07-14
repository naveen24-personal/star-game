import type { ChatMessage } from "@chit/shared";
import { getGifById } from "@chit/shared";

export type GifPopItem = ChatMessage & {
  left: number;
  top: number;
};

type Props = {
  pops: GifPopItem[];
};

export function GifPops({ pops }: Props) {
  return (
    <div className="gif-pops" aria-live="polite">
      {pops.map((p) => {
        const gif = getGifById(p.gifId);
        return (
          <div
            key={p.id}
            className="gif-pop"
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
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
