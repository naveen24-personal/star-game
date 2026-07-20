import type { CSSProperties, DragEvent } from "react";
import type { Card, Suit } from "@chit/shared";
import { cardRankLabel, isRedSuit } from "@chit/shared";

const SUIT_CENTER: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

type Props = {
  card: Card;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  onDragStart?: (e: DragEvent) => void;
};

export function PlayingCard({
  card,
  faceDown = false,
  size = "md",
  selected = false,
  draggable = false,
  onClick,
  className = "",
  style,
  onDragStart,
}: Props) {
  if (faceDown) {
    return (
      <div
        className={`pcard pcard--back pcard--${size} ${className}`}
        style={style}
        aria-hidden
      />
    );
  }

  const red = isRedSuit(card.suit);
  const rank = cardRankLabel(card.rank);
  const suit = SUIT_CENTER[card.suit];

  return (
    <button
      type="button"
      className={`pcard pcard--face pcard--${size} ${red ? "pcard--red" : "pcard--black"} ${selected ? "pcard--selected" : ""} ${className}`}
      style={style}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      disabled={!onClick && !draggable}
    >
      <span className="pcard__corner pcard__corner--tl">
        <span className="pcard__rank">{rank}</span>
        <span className="pcard__suit">{suit}</span>
      </span>
      <span className="pcard__center" aria-hidden>
        {card.rank <= 10 ? (
          <span className="pcard__pip pcard__pip--large">{suit}</span>
        ) : (
          <span className="pcard__court">{rank}</span>
        )}
      </span>
      <span className="pcard__corner pcard__corner--br">
        <span className="pcard__rank">{rank}</span>
        <span className="pcard__suit">{suit}</span>
      </span>
    </button>
  );
}

export function CardStack({ count, size = "sm" }: { count: number; size?: "sm" | "md" }) {
  const n = Math.min(Math.max(count, 0), 12);
  return (
    <div className={`pcard-stack pcard-stack--${size}`} aria-hidden>
      {Array.from({ length: Math.min(n, 5) }, (_, i) => (
        <PlayingCard
          key={i}
          card={{ id: `b${i}`, suit: "spades", rank: 1 }}
          faceDown
          size={size}
          className="pcard-stack__item"
          style={{ transform: `translateY(${-i * 2}px) translateX(${i * 1}px)` }}
        />
      ))}
    </div>
  );
}
