import type { SnakesRollEvent } from "@chit/shared";

type Props = {
  roll: SnakesRollEvent;
  playerName: string;
  onDone: () => void;
};

export function SnakeBiteFX({ roll, playerName, onDone }: Props) {
  return (
    <div className="snake-fx snake-fx--bite" role="alert" onAnimationEnd={onDone}>
      <div className="snake-fx__backdrop" />
      <div className="snake-fx__content">
        <svg className="snake-fx__svg" viewBox="0 0 200 120" aria-hidden>
          <defs>
            <linearGradient id="biteSnakeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#166534" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>
          <path
            className="snake-fx__body"
            d="M 10 80 Q 50 20, 90 50 T 170 30"
            fill="none"
            stroke="url(#biteSnakeGrad)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <ellipse className="snake-fx__head" cx="172" cy="28" rx="16" ry="12" fill="#22c55e" />
          <circle cx="178" cy="24" r="3" fill="#0f172a" />
          <circle cx="168" cy="24" r="3" fill="#0f172a" />
          <path className="snake-fx__tongue" d="M 188 32 L 198 34 L 188 36 Z" fill="#ef4444" />
        </svg>
        <p className="snake-fx__title">Snake bite!</p>
        <p className="snake-fx__sub">
          {playerName} slid from <strong>{roll.to}</strong> down to <strong>{roll.final}</strong>
        </p>
      </div>
    </div>
  );
}

export function LadderClimbFX({
  roll,
  playerName,
  onDone,
}: Props) {
  return (
    <div className="snake-fx snake-fx--ladder" role="status" onAnimationEnd={onDone}>
      <div className="snake-fx__backdrop snake-fx__backdrop--green" />
      <div className="snake-fx__content">
        <div className="snake-fx__ladder-icon" aria-hidden>
          🪜
        </div>
        <p className="snake-fx__title">Climb the ladder!</p>
        <p className="snake-fx__sub">
          {playerName} climbed from <strong>{roll.to}</strong> up to <strong>{roll.final}</strong>
        </p>
      </div>
    </div>
  );
}
