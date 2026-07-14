import type { Chit } from "@chit/shared";

type Props = {
  chit: Chit;
  selected?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

export function ChitCard({ chit, selected, faceDown, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      className={`chit ${selected ? "chit--selected" : ""} ${faceDown ? "chit--down" : ""}`}
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-pressed={selected}
    >
      {faceDown ? (
        <span className="chit__fold">Folded</span>
      ) : (
        <span className="chit__text">{chit.text}</span>
      )}
    </button>
  );
}
