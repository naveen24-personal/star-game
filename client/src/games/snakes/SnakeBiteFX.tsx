import type { SnakesRollEvent } from "@chit/shared";

type Props = {
  roll: SnakesRollEvent;
  playerName: string;
};

export function SnakeBiteFX({ roll, playerName }: Props) {
  return (
    <div className="snake-bite-moment" role="alert">
      <div className="snake-bite-moment__vignette" />
      <div className="snake-bite-moment__content">
        <div className="snake-bite-moment__emoji">🐍💥</div>
        <p className="snake-bite-moment__title">SNAKE BITE!</p>
        <p className="snake-bite-moment__sub">
          {playerName} got chomped — {roll.to} → {roll.final}
        </p>
        <p className="snake-bite-moment__genz">no cap that snake was hungry 😭</p>
      </div>
      <svg className="snake-bite-moment__jaws" viewBox="0 0 120 80" aria-hidden>
        <g className="snake-bite-moment__jaw-group">
          <path
            className="snake-bite-moment__jaw-top"
            d="M 10 45 Q 60 5 110 45 L 100 50 Q 60 25 20 50 Z"
            fill="#22c55e"
            stroke="#14532d"
          />
          <path
            className="snake-bite-moment__jaw-bottom"
            d="M 10 48 Q 60 78 110 48 L 100 52 Q 60 72 20 52 Z"
            fill="#16a34a"
            stroke="#14532d"
          />
          <circle cx="38" cy="42" r="4" fill="#fff" />
          <circle cx="39" cy="41" r="2" fill="#000" />
          <circle cx="82" cy="42" r="4" fill="#fff" />
          <circle cx="81" cy="41" r="2" fill="#000" />
        </g>
      </svg>
    </div>
  );
}

export function LadderClimbFX({ roll, playerName }: Props) {
  return (
    <div className="snake-bite-moment snake-bite-moment--ladder" role="status">
      <div className="snake-bite-moment__vignette snake-bite-moment__vignette--green" />
      <div className="snake-bite-moment__content">
        <div className="snake-bite-moment__emoji">🪜✨</div>
        <p className="snake-bite-moment__title">LADDER UP!</p>
        <p className="snake-bite-moment__sub">
          {playerName} climbed {roll.to} → {roll.final}
        </p>
        <p className="snake-bite-moment__genz">main character energy 🔥</p>
      </div>
    </div>
  );
}
