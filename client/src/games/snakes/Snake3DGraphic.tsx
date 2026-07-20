import { getCellCenter, snakeCurvePath } from "./boardLayout";

export type SnakeStyle = "stripe-red" | "emerald" | "gold" | "coral";

const STYLES: SnakeStyle[] = ["stripe-red", "emerald", "gold", "coral"];

type Props = {
  head: number;
  tail: number;
  index: number;
  mouthOpen?: boolean;
};

export function Snake3DGraphic({ head, tail, index, mouthOpen }: Props) {
  const style = STYLES[index % STYLES.length];
  const path = snakeCurvePath(head, tail);
  const hc = getCellCenter(head);
  const tc = getCellCenter(tail);
  const angle =
    (Math.atan2(tc.y - hc.y, tc.x - hc.x) * 180) / Math.PI;
  const gradId = `snake-body-${head}-${tail}`;
  const shadowId = `snake-sh-${head}`;

  return (
    <g className={`snake-3d snake-3d--${style} ${mouthOpen ? "snake-3d--bite" : ""}`}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          {style === "stripe-red" && (
            <>
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#fecaca" />
              <stop offset="100%" stopColor="#dc2626" />
            </>
          )}
          {style === "emerald" && (
            <>
              <stop offset="0%" stopColor="#059669" />
              <stop offset="45%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#047857" />
            </>
          )}
          {style === "gold" && (
            <>
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#d97706" />
            </>
          )}
          {style === "coral" && (
            <>
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#c2410c" />
            </>
          )}
        </linearGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.8" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>

      <path
        d={path}
        fill="none"
        stroke="#000"
        strokeWidth="4.2"
        strokeLinecap="round"
        opacity="0.25"
      />
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="3.4"
        strokeLinecap="round"
        filter={`url(#${shadowId})`}
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <g transform={`translate(${hc.x} ${hc.y}) rotate(${angle})`}>
        <ellipse cx="0" cy="0.3" rx="3.2" ry="2.4" fill="rgba(0,0,0,0.2)" />
        <g className="snake-3d__head">
          <ellipse cx="0" cy="0" rx="3" ry="2.2" fill={`url(#${gradId})`} stroke="#1e293b" strokeWidth="0.25" />
          <circle cx="1" cy="-0.5" r="0.55" fill="#fff" />
          <circle cx="1.15" cy="-0.55" r="0.28" fill="#0f172a" />
          <circle cx="-0.8" cy="-0.5" r="0.55" fill="#fff" />
          <circle cx="-0.65" cy="-0.55" r="0.28" fill="#0f172a" />
          {mouthOpen ? (
            <>
              <path className="snake-3d__jaw snake-3d__jaw--top" d="M -1.2 0.5 Q 0 -0.8 1.2 0.5" fill="#7f1d1d" />
              <path className="snake-3d__jaw snake-3d__jaw--bottom" d="M -1.2 0.8 Q 0 2.2 1.2 0.8" fill="#991b1b" />
              <path d="M -0.3 1.2 L 0 1.8 L 0.3 1.2" fill="#ef4444" />
            </>
          ) : (
            <path d="M 0.5 0.2 L 1.8 0.5 L 0.5 0.8 Z" fill="#ef4444" />
          )}
        </g>
      </g>
    </g>
  );
}
