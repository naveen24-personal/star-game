import { useEffect, useMemo, useState } from "react";
import type { ChatMessage, PublicRoom } from "@chit/shared";
import { bindRoomHandlers, getSocket } from "./socket";
import { GifChat } from "./components/GifChat";
import { GifPops, type GifPopItem } from "./components/GifPops";
import { Lobby } from "./pages/Lobby";
import { WaitingLobby } from "./pages/WaitingLobby";
import { WriteChits } from "./pages/WriteChits";
import { ThrowAndPick } from "./pages/ThrowAndPick";
import { PassRound } from "./pages/PassRound";
import { RevealWinner } from "./pages/RevealWinner";
import { seatPositionMap } from "./seatLayout";

const POP_MS = 2800;

export default function App() {
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pops, setPops] = useState<GifPopItem[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  useEffect(() => {
    getSocket();
    return bindRoomHandlers({
      onRoom: (r) => {
        setRoom(r);
        setRoomCode(r.code);
        setError(null);
      },
      onError: (e) => setError(e.message),
      onChat: (m: ChatMessage) => {
        setPops((prev) => [...prev.filter((p) => p.id !== m.id), m].slice(-8));
        window.setTimeout(() => {
          setPops((prev) => prev.filter((p) => p.id !== m.id));
        }, POP_MS);
      },
    });
  }, []);

  useEffect(() => {
    setPops([]);
    setChatOpen(false);
  }, [roomCode]);

  const tablePhase =
    room?.phase === "throwing" ||
    room?.phase === "picking" ||
    room?.phase === "passing";

  const fallbackPositions = useMemo(() => {
    if (!room || tablePhase) return undefined;
    const map = seatPositionMap(room);
    const obj: Record<string, { left: number; top: number }> = {};
    map.forEach((v, k) => {
      // Map arena % into a softer overlay area for non-table screens
      obj[k] = { left: 18 + (v.left / 100) * 64, top: 22 + (v.top / 100) * 50 };
    });
    return obj;
  }, [room, tablePhase]);

  return (
    <div className={`app ${tablePhase ? "app--table" : ""}`}>
      <div className="backdrop" aria-hidden />
      <main className={`shell ${tablePhase ? "shell--wide" : ""}`}>
        {!room && <Lobby />}
        {room?.phase === "lobby" && <WaitingLobby room={room} />}
        {room?.phase === "writing" && <WriteChits room={room} />}
        {(room?.phase === "throwing" || room?.phase === "picking") && (
          <ThrowAndPick room={room} pops={pops} />
        )}
        {room?.phase === "passing" && <PassRound room={room} pops={pops} />}
        {room?.phase === "revealed" && <RevealWinner room={room} />}

        {error && (
          <div className="toast" role="alert">
            {error}
            <button type="button" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}
      </main>

      {!tablePhase && room && (
        <GifPops pops={pops} positions={fallbackPositions} />
      )}

      {room && (
        <GifChat open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
      )}
    </div>
  );
}
