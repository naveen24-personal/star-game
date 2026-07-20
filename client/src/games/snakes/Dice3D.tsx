const FACE_ROT: Record<number, string> = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(0deg) rotateY(-90deg)",
  3: "rotateX(-90deg) rotateY(0deg)",
  4: "rotateX(90deg) rotateY(0deg)",
  5: "rotateX(0deg) rotateY(90deg)",
  6: "rotateX(0deg) rotateY(180deg)",
};

const FACE_DOTS: Record<1 | 2 | 3 | 4 | 5 | 6, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [30, 30],
    [70, 70],
  ],
  3: [
    [30, 30],
    [50, 50],
    [70, 70],
  ],
  4: [
    [30, 30],
    [70, 30],
    [30, 70],
    [70, 70],
  ],
  5: [
    [30, 30],
    [70, 30],
    [50, 50],
    [30, 70],
    [70, 70],
  ],
  6: [
    [30, 25],
    [70, 25],
    [30, 50],
    [70, 50],
    [30, 75],
    [70, 75],
  ],
};

function Face({ n }: { n: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const dots = FACE_DOTS[n];

  return (
    <div className={`dice3d__face dice3d__face--${n}`}>
      {dots.map(([x, y], i) => (
        <span key={i} className="dice3d__pip" style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
    </div>
  );
}

type Props = {
  value: number | null;
  rolling: boolean;
  size?: "sm" | "lg";
};

export function Dice3D({ value, rolling, size = "lg" }: Props) {
  const settled = !rolling && value != null && value >= 1 && value <= 6;
  const transform = settled ? FACE_ROT[value] : undefined;

  return (
    <div
      className={`dice3d dice3d--${size} ${rolling ? "dice3d--rolling" : ""}`}
      aria-live="polite"
      aria-label={settled ? `Dice showing ${value}` : rolling ? "Dice rolling" : "Dice"}
    >
      <div className="dice3d__scene">
        <div className="dice3d__cube" style={transform ? { transform } : undefined}>
          <Face n={1} />
          <Face n={2} />
          <Face n={3} />
          <Face n={4} />
          <Face n={5} />
          <Face n={6} />
        </div>
      </div>
    </div>
  );
}
