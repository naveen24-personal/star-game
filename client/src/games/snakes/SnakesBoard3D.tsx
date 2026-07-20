import type { PublicSnakesPlayer } from "@chit/shared";
import { LADDERS, SNAKES, SNAKES_WIN } from "@chit/shared";
import {
  cellNumber,
  getCellCenter,
  ladderRails,
  ladderRungs,
  snakeCurvePath,
  TOKEN_COLORS,
} from "./boardLayout";

type Props = {
  players: PublicSnakesPlayer[];
  youPlayerId: string;
  highlightFrom?: number | null;
  highlightTo?: number | null;
};

export function SnakesBoard3D({ players, youPlayerId, highlightFrom, highlightTo }: Props) {
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
    <div className="snakes-scene">
      <div className="snakes-board-stage">
        <div className="snakes-board-3d">
          <div className="snakes-board-frame">
            <div className="snakes-board-inner">
              <svg className="snakes-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="snakeBody" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14532d" />
                    <stop offset="40%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#166534" />
                  </linearGradient>
                  <linearGradient id="ladderWood" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#92400e" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                  <filter id="snakeGlow">
                    <feDropShadow dx="0" dy="0.4" stdDeviation="0.6" floodColor="#14532d" floodOpacity="0.6" />
                  </filter>
                </defs>

                {ladderEntries.map(({ bottom, top }) => {
                  const rails = ladderRails(bottom, top);
                  const rungs = ladderRungs(bottom, top);
                  return (
                    <g key={`ladder-${bottom}-${top}`} className="snakes-overlay__ladder">
                      {rails.map((r, i) => (
                        <line
                          key={i}
                          x1={r.x1}
                          y1={r.y1}
                          x2={r.x2}
                          y2={r.y2}
                          stroke="url(#ladderWood)"
                          strokeWidth="1.1"
                          strokeLinecap="round"
                        />
                      ))}
                      {rungs.map((r, i) => (
                        <line
                          key={i}
                          x1={r.x1}
                          y1={r.y1}
                          x2={r.x2}
                          y2={r.y2}
                          stroke="#b45309"
                          strokeWidth="0.85"
                          strokeLinecap="round"
                        />
                      ))}
                    </g>
                  );
                })}

                {snakeEntries.map(({ head, tail }) => {
                  const path = snakeCurvePath(head, tail);
                  const hc = getCellCenter(head);
                  const angle =
                    (Math.atan2(getCellCenter(tail).y - hc.y, getCellCenter(tail).x - hc.x) * 180) /
                    Math.PI;
                  return (
                    <g key={`snake-${head}-${tail}`} className="snakes-overlay__snake" filter="url(#snakeGlow)">
                      <path
                        d={path}
                        fill="none"
                        stroke="url(#snakeBody)"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      />
                      <path
                        d={path}
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="1"
                        strokeLinecap="round"
                        opacity="0.45"
                      />
                      <g transform={`translate(${hc.x} ${hc.y}) rotate(${angle})`}>
                        <ellipse cx="0" cy="0" rx="2.2" ry="1.6" fill="#22c55e" stroke="#14532d" strokeWidth="0.3" />
                        <circle cx="0.8" cy="-0.4" r="0.35" fill="#0f172a" />
                        <circle cx="-0.5" cy="-0.4" r="0.35" fill="#0f172a" />
                        <path d="M 2.2 0 L 3.2 0.3 L 2.2 0.6 Z" fill="#ef4444" />
                      </g>
                    </g>
                  );
                })}
              </svg>

              <div className="snakes-grid">
                {Array.from({ length: 10 }, (_, row) =>
                  Array.from({ length: 10 }, (_, col) => {
                    const n = cellNumber(9 - row, col);
                    const isLadderStart = LADDERS[n];
                    const isSnakeHead = SNAKES[n];
                    const isGoal = n === SNAKES_WIN;
                    const isStart = n === 1;
                    const occupants = byCell.get(n) ?? [];
                    const highlighted = n === highlightFrom || n === highlightTo;

                    return (
                      <div
                        key={n}
                        className={[
                          "snakes-cell",
                          row % 2 === 0 ? "snakes-cell--cream" : "snakes-cell--gold",
                          isLadderStart ? "snakes-cell--ladder-foot" : "",
                          isSnakeHead ? "snakes-cell--snake-head" : "",
                          isGoal ? "snakes-cell--goal" : "",
                          isStart ? "snakes-cell--start" : "",
                          highlighted ? "snakes-cell--flash" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {isStart && <span className="snakes-cell__badge">START</span>}
                        {isGoal && <span className="snakes-cell__badge snakes-cell__badge--goal">🏆</span>}
                        <span className="snakes-cell__num">{n}</span>
                        <span className="snakes-cell__tokens">
                          {occupants.map((p) => {
                            const color = TOKEN_COLORS[p.seat % TOKEN_COLORS.length];
                            return (
                              <span
                                key={p.id}
                                className={`snakes-token ${p.id === youPlayerId ? "snakes-token--you" : ""}`}
                                style={{ background: color }}
                                title={p.nickname}
                              >
                                {p.nickname.slice(0, 1)}
                              </span>
                            );
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="snakes-board-shadow" aria-hidden />
      </div>
    </div>
  );
}
