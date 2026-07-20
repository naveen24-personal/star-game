import { useEffect, useState } from "react";
import type {
  ChatMessage,
  GameId,
  PublicBingoRoom,
  PublicRummyRoom,
  PublicRoom,
  PublicSnakesRoom,
  RoomUpdate,
} from "@chit/shared";
import { bindRoomHandlers, getSocket } from "./socket";
import { GifChat } from "./components/GifChat";
import type { GifPopItem } from "./components/GifPops";
import { GameHub, themeForGame } from "./pages/GameHub";
import { Lobby } from "./pages/Lobby";
import { ChitApp } from "./games/chit/ChitApp";
import { BingoPlay, BingoWaiting } from "./games/bingo/BingoScreens";
import { RummyPlay, RummyWaiting } from "./games/rummy/RummyScreens";
import { SnakesPlay, SnakesWaiting } from "./games/snakes/SnakesScreens";

const POP_MS = 2800;

export default function App() {
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [room, setRoom] = useState<RoomUpdate | null>(null);
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
        setSelectedGame(r.gameId);
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

  const theme = room ? themeForGame(room.gameId) : selectedGame ? themeForGame(selectedGame) : "theme-hub";
  const tablePhase = room?.gameId === "chit" && (
    room.phase === "throwing" || room.phase === "picking" || room.phase === "passing"
  );

  return (
    <div className={`app ${theme} ${tablePhase ? "app--table" : ""}`}>
      <div className={`backdrop ${tablePhase ? "backdrop--table" : ""}`} aria-hidden />
      <main className={`shell ${tablePhase ? "shell--table" : room?.gameId === "snakes" && room.phase === "playing" ? "shell--wide" : ""}`}>
        {!room && !selectedGame && <GameHub onSelect={setSelectedGame} />}
        {!room && selectedGame && (
          <Lobby
            gameId={selectedGame}
            onBack={() => {
              setSelectedGame(null);
              setError(null);
            }}
          />
        )}

        {room?.gameId === "chit" && (
          <ChitApp
            room={room as PublicRoom}
            error={error}
            onDismissError={() => setError(null)}
            pops={pops}
            chatOpen={chatOpen}
            onToggleChat={() => setChatOpen((o) => !o)}
          />
        )}

        {room?.gameId === "bingo" && (
          <>
            {(room as PublicBingoRoom).phase === "lobby" && <BingoWaiting room={room as PublicBingoRoom} />}
            {((room as PublicBingoRoom).phase === "playing" || (room as PublicBingoRoom).phase === "won") && (
              <BingoPlay room={room as PublicBingoRoom} />
            )}
            <GifChat open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
          </>
        )}

        {room?.gameId === "rummy" && (
          <>
            {(room as PublicRummyRoom).phase === "lobby" && <RummyWaiting room={room as PublicRummyRoom} />}
            {((room as PublicRummyRoom).phase === "playing" || (room as PublicRummyRoom).phase === "won") && (
              <RummyPlay room={room as PublicRummyRoom} />
            )}
            <GifChat open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
          </>
        )}

        {room?.gameId === "snakes" && (
          <>
            {(room as PublicSnakesRoom).phase === "lobby" && <SnakesWaiting room={room as PublicSnakesRoom} />}
            {((room as PublicSnakesRoom).phase === "playing" || (room as PublicSnakesRoom).phase === "won") && (
              <SnakesPlay room={room as PublicSnakesRoom} />
            )}
            <GifChat open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
          </>
        )}

        {room && room.gameId !== "chit" && error && (
          <div className="toast" role="alert">
            {error}
            <button type="button" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
