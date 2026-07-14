import type { Chit } from "@chit/shared";
import { scatterStyle } from "../seatLayout";
import { ChitCard } from "./ChitCard";

type Props = {
  chits: Chit[];
  /** Face-down pile on the table */
  faceDown?: boolean;
  disabled?: boolean;
  onClaim?: (chitId: string) => void;
  thrown?: boolean;
};

export function ScatteredPool({ chits, faceDown = true, disabled, onClaim, thrown }: Props) {
  return (
    <div className={`scatter-pool ${thrown ? "scatter-pool--thrown" : ""}`}>
      {chits.map((chit, i) => {
        const style = scatterStyle(chit.id, i, chits.length);
        return (
          <div key={chit.id} className="scatter-pool__item" style={style}>
            <ChitCard
              chit={chit}
              faceDown={faceDown}
              size="tiny"
              disabled={disabled || !onClaim}
              onClick={onClaim ? () => onClaim(chit.id) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
