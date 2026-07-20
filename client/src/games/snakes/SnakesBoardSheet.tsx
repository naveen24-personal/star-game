import type { PublicSnakesPlayer } from "@chit/shared";
import { LADDERS, SNAKES, SNAKES_WIN } from "@chit/shared";
import { cellNumber, ladderRails, ladderRungs, TOKEN_COLORS } from "./boardLayout";
import { Snake3DGraphic } from "./Snake3DGraphic";

type Props = {
  players: PublicSnakesPlayer[];
  youPlayerId: string;
  currentTurnPlayerId: string | null;
  highlightFrom?: number | null;
  highlightTo?: number | null;
  biteHead?: number | null;
};

export function SnakesBoardSheet({
  players,
  youPlayerId,
  currentTurnPlayerId,
  highlightFrom,
  highlightTo,
  biteHead,
}: Props) {
  const tokens = players.filter((p) => p.connected && p.position > 0);
  const byCell = new Map<number, PublicSnakesPlayer[]>();
  for (const p of tokens) {
    const list = byCell.get(p.position) ?? [];
    list.push(p);
    byCell.set(p.position, list);
  }

  const snakeEntries = Object.entries(SNAKES).map(([h, t]) => ({
    head: Number(h),
    tail: t,
  }));
  const ladderEntries = Object.entries(LADDERS).map(([b, t]) => ({
    bottom: Number(b),
    top: t,
  }));

  return (
    <div className="snakes-sheet">
      <svg className="snakes-sheet__overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="ladderWood" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="40%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <filter id="ladderShadow">
            <feDropShadow dx="0" dy="0.4" stdDeviation="0.5" floodOpacity="0.4" />
          </filter>
        </defs>

        {ladderEntries.map(({ bottom, top }) => {
          const rails = ladderRails(bottom, top);
          const rungs = ladderRungs(bottom, top, 8);
          return (
            <g key={`ladder-${bottom}-${top}`} filter="url(#ladderShadow)">
              {rails.map((r, i) => (
                <line
                  key={`r${i}`}
                  x1={r.x1}
                  y1={r.y1}
                  x2={r.x2}
                  y2={r.y2}
                  stroke="url(#ladderWood)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              ))}
              {rungs.map((r, i) => (
                <line
                  key={`g${i}`}
                  x1={r.x1}
                  y1={r.y1}
                  x2={r.x2}
                  y2={r.y2}
                  stroke="#78350f"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              ))}
            </g>
          );
        })}

        {snakeEntries.map(({ head, tail }, i) => (
          <Snake3DGraphic
            key={`snake-${head}-${tail}`}
            head={head}
            tail={tail}
            index={i}
            mouthOpen={biteHead === head}
          />
        ))}
      </svg>

      <div className="snakes-sheet__grid">
        {Array.from({ length: 10 }, (_, row) =>
          Array.from({ length: 10 }, (_, col) => {
            const n = cellNumber(9 - row, col);
            const rowTone = (9 - row) % 2 === 0 ? "mint" : "ocean";
            const isGoal = n === SNAKES_WIN;
            const isStart = n === 1;
            const occupants = byCell.get(n) ?? [];
            const highlighted = n === highlightFrom || n === highlightTo;

            return (
              <div
                key={n}
                className={[
                  "snakes-tile",
                  `snakes-tile--${rowTone}`,
                  isStart ? "snakes-tile--go" : "",
                  isGoal ? "snakes-tile--home" : "",
                  highlighted ? "snakes-tile--flash" : "",
                  biteHead === n ? "snakes-tile--bite" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {isStart && (
                  <span className="snakes-tile__go">
                    <span className="snakes-tile__go-arrow">→</span> GO
                  </span>
                )}
                {isGoal ? (
                  <span className="snakes-tile__home">
                    <span className="snakes-tile__crown">👑</span>
                    <span className="snakes-tile__home-label">HOME</span>
                  </span>
                ) : (
                  !isStart && <span className="snakes-tile__num">{n}</span>
                )}
                <div className="snakes-tile__tokens">
                  {occupants.map((p) => {
                    const color = TOKEN_COLORS[p.seat % TOKEN_COLORS.length];
                    const isYou = p.id === youPlayerId;
                    const isTurn = p.id === currentTurnPlayerId;
                    return (
                      <span
                        key={p.id}
                        className={`snakes-piece ${isYou ? "snakes-piece--you" : ""} ${isTurn ? "snakes-piece--turn" : ""}`}
                        style={{ ["--piece-color" as string]: color }}
                        title={p.nickname}
                      >
                        {isTurn && <span className="snakes-piece__glow" aria-hidden />}
                        <span className="snakes-piece__letter">
                          {p.nickname.slice(0, 1).toUpperCase()}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
