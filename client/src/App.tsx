import { useEffect, useState } from "react";
import type { ChatMessage, PublicRoom } from "@chit/shared";
import { bindRoomHandlers, getSocket } from "./socket";
import { GifChat } from "./components/GifChat";
import { Lobby } from "./pages/Lobby";
import { WaitingLobby } from "./pages/WaitingLobby";
import { WriteChits } from "./pages/WriteChits";
import { ThrowAndPick } from "./pages/ThrowAndPick";
import { PassRound } from "./pages/PassRound";
import { RevealWinner } from "./pages/RevealWinner";

export default function App() {
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(true);
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
      onChat: (m) => setMessages((prev) => [...prev.slice(-40), m]),
    });
  }, []);

  useEffect(() => {
    setMessages([]);
  }, [roomCode]);

  return (
    <div className="app">
      <div className="backdrop" aria-hidden />
      <main className="shell">
        {!room && <Lobby />}
        {room?.phase === "lobby" && <WaitingLobby room={room} />}
        {room?.phase === "writing" && <WriteChits room={room} />}
        {(room?.phase === "throwing" || room?.phase === "picking") && (
          <ThrowAndPick room={room} />
        )}
        {room?.phase === "passing" && <PassRound room={room} />}
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

      {room && (
        <GifChat messages={messages} open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
      )}
    </div>
  );
}
