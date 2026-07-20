export type DiceColor = "white" | "red" | "black";

const FACE_ROT: Record<number, string> = {
  1: "rotateX(-8deg) rotateY(12deg)",
  2: "rotateX(-8deg) rotateY(-78deg)",
  3: "rotateX(-98deg) rotateY(12deg)",
  4: "rotateX(82deg) rotateY(12deg)",
  5: "rotateX(-8deg) rotateY(102deg)",
  6: "rotateX(-8deg) rotateY(192deg)",
};

const FACE_DOTS: Record<1 | 2 | 3 | 4 | 5 | 6, [number, number][]> = {
  1: [[50, 50]],
  2: [[32, 32], [68, 68]],
  3: [[32, 32], [50, 50], [68, 68]],
  4: [[32, 32], [68, 32], [32, 68], [68, 68]],
  5: [[32, 32], [68, 32], [50, 50], [32, 68], [68, 68]],
  6: [[32, 26], [68, 26], [32, 50], [68, 50], [32, 74], [68, 74]],
};

function Face({
  n,
  pipColor,
  faceBg,
  edge,
}: {
  n: 1 | 2 | 3 | 4 | 5 | 6;
  pipColor: string;
  faceBg: string;
  edge: string;
}) {
  return (
    <div
      className={`dice-pro__face dice-pro__face--${n}`}
      style={{ background: faceBg, borderColor: edge }}
    >
      {FACE_DOTS[n].map(([x, y], i) => (
        <span
          key={i}
          className="dice-pro__pip"
          style={{ left: `${x}%`, top: `${y}%`, background: pipColor }}
        />
      ))}
    </div>
  );
}

const THEMES: Record<DiceColor, { face: string; pip: string; edge: string; glow: string }> = {
  white: {
    face: "linear-gradient(145deg, #ffffff 0%, #e2e8f0 55%, #cbd5e1 100%)",
    pip: "#0f172a",
    edge: "#94a3b8",
    glow: "rgba(255,255,255,0.5)",
  },
  red: {
    face: "linear-gradient(145deg, #fca5a5 0%, #ef4444 50%, #b91c1c 100%)",
    pip: "#ffffff",
    edge: "#991b1b",
    glow: "rgba(239,68,68,0.55)",
  },
  black: {
    face: "linear-gradient(145deg, #475569 0%, #1e293b 50%, #0f172a 100%)",
    pip: "#f8fafc",
    edge: "#334155",
    glow: "rgba(15,23,42,0.6)",
  },
};

type Props = {
  value: number | null;
  rolling: boolean;
  color: DiceColor;
  onClick?: () => void;
  disabled?: boolean;
};

export function Dice3D({ value, rolling, color, onClick, disabled }: Props) {
  const theme = THEMES[color];
  const settled = !rolling && value != null && value >= 1 && value <= 6;
  const transform = settled ? FACE_ROT[value] : "rotateX(-18deg) rotateY(24deg)";

  return (
    <button
      type="button"
      className={`dice-pro dice-pro--${color} ${rolling ? "dice-pro--rolling" : ""} ${onClick ? "dice-pro--clickable" : ""}`}
      style={{ ["--dice-glow" as string]: theme.glow }}
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-live="polite"
      aria-label={
        settled ? `Dice showing ${value}. Tap to roll.` : rolling ? "Dice rolling" : "Tap dice to roll"
      }
    >
      <div className="dice-pro__shadow" aria-hidden />
      <div className="dice-pro__scene">
        <div className="dice-pro__cube" style={{ transform }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Face
              key={n}
              n={n as 1 | 2 | 3 | 4 | 5 | 6}
              pipColor={theme.pip}
              faceBg={theme.face}
              edge={theme.edge}
            />
          ))}
        </div>
      </div>
      {settled && <span className="dice-pro__result">{value}</span>}
      {!rolling && onClick && !disabled && (
        <span className="dice-pro__hint">Tap to roll</span>
      )}
    </button>
  );
}

export function DiceColorPicker({
  color,
  onChange,
}: {
  color: DiceColor;
  onChange: (c: DiceColor) => void;
}) {
  const options: { id: DiceColor; label: string }[] = [
    { id: "white", label: "White" },
    { id: "red", label: "Red" },
    { id: "black", label: "Black" },
  ];
  return (
    <div className="dice-colors" role="group" aria-label="Dice color">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`dice-colors__btn dice-colors__btn--${o.id} ${color === o.id ? "dice-colors__btn--on" : ""}`}
          onClick={() => onChange(o.id)}
          title={o.label}
        />
      ))}
    </div>
  );
}
