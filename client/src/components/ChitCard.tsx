import { useEffect, useState } from "react";
import type { Chit } from "@chit/shared";

type Props = {
  chit: Chit;
  selected?: boolean;
  faceDown?: boolean;
  /** Animate from folded → open when becoming face-up */
  unfold?: boolean;
  size?: "normal" | "tiny";
  onClick?: () => void;
  disabled?: boolean;
};

export function ChitCard({
  chit,
  selected,
  faceDown,
  unfold,
  size = "normal",
  onClick,
  disabled,
}: Props) {
  const [flippedOpen, setFlippedOpen] = useState(!faceDown && !unfold);

  useEffect(() => {
    if (faceDown) {
      setFlippedOpen(false);
      return;
    }
    if (!unfold) {
      setFlippedOpen(true);
      return;
    }
    setFlippedOpen(false);
    const t = window.setTimeout(() => setFlippedOpen(true), 40);
    return () => window.clearTimeout(t);
  }, [faceDown, unfold, chit.id]);

  const showBack = faceDown || !flippedOpen;

  return (
    <button
      type="button"
      className={[
        "chit",
        size === "tiny" ? "chit--tiny" : "",
        selected ? "chit--selected" : "",
        showBack ? "chit--down" : "chit--up",
        unfold && flippedOpen ? "chit--unfolded" : "",
        unfold && !showBack ? "chit--unfold-anim" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-pressed={selected}
    >
      <span className="chit__inner">
        {showBack ? (
          <span className="chit__fold">Folded</span>
        ) : (
          <span className="chit__text">{chit.text}</span>
        )}
      </span>
    </button>
  );
}
