type Props = {
  count: number;
  /** Slight fan angle / alignment for corner seats */
  align?: "left" | "center" | "right";
};

/** Face-down fanned stack of opponent chits (UNO-style). */
export function OpponentFan({ count, align = "center" }: Props) {
  const n = Math.min(Math.max(count, 0), 14);
  if (n === 0) {
    return <div className={`opp-fan opp-fan--${align} opp-fan--empty`} />;
  }
  return (
    <div className={`opp-fan opp-fan--${align}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const mid = (n - 1) / 2;
        const offset = i - mid;
        const rot = offset * 7;
        const x = offset * 11;
        return (
          <span
            key={i}
            className="opp-fan__card"
            style={{
              transform: `translateX(${x}px) rotate(${rot}deg)`,
              zIndex: i,
            }}
          />
        );
      })}
    </div>
  );
}
