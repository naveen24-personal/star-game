import { useMemo } from "react";
import type { GifPopItem } from "../../components/GifPops";
import type { PublicRoom } from "@chit/shared";
import { GifChat } from "../../components/GifChat";
import { GifPops } from "../../components/GifPops";
import { WaitingLobby } from "../../pages/WaitingLobby";
import { WriteChits } from "../../pages/WriteChits";
import { ThrowAndPick } from "../../pages/ThrowAndPick";
import { PassRound } from "../../pages/PassRound";
import { RevealWinner } from "../../pages/RevealWinner";
import { seatPositionMap } from "../../seatLayout";

type Props = {
  room: PublicRoom;
  error: string | null;
  onDismissError: () => void;
  pops: GifPopItem[];
  chatOpen: boolean;
  onToggleChat: () => void;
};

export function ChitApp({ room, error, onDismissError, pops, chatOpen, onToggleChat }: Props) {
  const tablePhase =
    room.phase === "throwing" || room.phase === "picking" || room.phase === "passing";

  const fallbackPositions = useMemo(() => {
    if (tablePhase) return undefined;
    const map = seatPositionMap(room);
    const obj: Record<string, { left: number; top: number }> = {};
    map.forEach((v, k) => {
      obj[k] = { left: 18 + (v.left / 100) * 64, top: 22 + (v.top / 100) * 50 };
    });
    return obj;
  }, [room, tablePhase]);

  return (
    <>
      {room.phase === "lobby" && <WaitingLobby room={room} />}
      {room.phase === "writing" && <WriteChits room={room} />}
      {(room.phase === "throwing" || room.phase === "picking") && (
        <ThrowAndPick room={room} pops={pops} />
      )}
      {room.phase === "passing" && <PassRound room={room} pops={pops} />}
      {room.phase === "revealed" && <RevealWinner room={room} />}

      {error && (
        <div className="toast" role="alert">
          {error}
          <button type="button" onClick={onDismissError}>
            Dismiss
          </button>
        </div>
      )}

      {!tablePhase && <GifPops pops={pops} positions={fallbackPositions} />}
      <GifChat open={chatOpen} onToggle={onToggleChat} />
    </>
  );
}
