import type { GameId, GameInfo } from "@chit/shared";
import { GAME_CATALOG, GAME_IDS } from "@chit/shared";

type Props = {
  onSelect: (gameId: GameId) => void;
};

function GameCard({ game, onSelect }: { game: GameInfo; onSelect: (id: GameId) => void }) {
  return (
    <button type="button" className={`game-card ${game.themeClass}`} onClick={() => onSelect(game.id)}>
      <span className="game-card__emoji" aria-hidden>
        {game.emoji}
      </span>
      <span className="game-card__name">{game.name}</span>
      <span className="game-card__tagline">{game.tagline}</span>
      <span className="game-card__players">
        {game.minPlayers}–{game.maxPlayers} players
      </span>
    </button>
  );
}

export function GameHub({ onSelect }: Props) {
  return (
    <section className="panel hub">
      <p className="eyebrow">Pick your game</p>
      <h1 className="brand hub-brand">Game Party</h1>
      <p className="lede">Four multiplayer classics — each room, its own vibe. Free in the browser.</p>
      <div className="game-grid">
        {GAME_IDS.map((id) => (
          <GameCard key={id} game={GAME_CATALOG[id]} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

export function themeForGame(gameId: GameId): string {
  return GAME_CATALOG[gameId].themeClass;
}
