import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gameApi } from '../api/endpoints';

// Static fallback so the page still renders a full menu even before the
// backend's GameMeta collection has been seeded, or if that call fails.
const FALLBACK_GAMES = [
  { slug: 'rock-paper-scissors', title: 'Rock Paper Scissors', description: 'Beat the computer, best of luck.' },
  { slug: 'quick-math-quiz', title: 'Quick Math Quiz', description: 'Timed arithmetic sprint.' },
  { slug: 'memory-match', title: 'Memory Match', description: 'Flip cards, find every pair.' },
  { slug: 'whack-a-mole', title: 'Whack-a-Mole', description: 'Fast reflexes, fast clicks.' },
  { slug: 'tic-tac-toe', title: 'Tic-Tac-Toe', description: 'Classic 3x3 grid vs the computer.' },
  { slug: 'simon-says', title: 'Simon Says', description: 'Repeat the growing color sequence.' },
];

// Only this one has a route + component built so far — see games/RockPaperScissors.
const PLAYABLE_SLUGS = new Set(['rock-paper-scissors']);

export default function HomePage() {
  const [games, setGames] = useState(FALLBACK_GAMES);

  useEffect(() => {
    let cancelled = false;
    gameApi
      .list()
      .then((res) => {
        if (!cancelled && res.data.games?.length) {
          setGames(res.data.games);
        }
      })
      .catch(() => {
        // Fine to stay on the static fallback — the menu should never look empty.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Pick your game</h1>
        <p className="mt-1 text-muted">Six quick browser games. Every score counts toward the leaderboard.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {games.map((game) => {
          const playable = PLAYABLE_SLUGS.has(game.slug);
          const card = (
            <div
              className={`card h-full transition ${
                playable ? 'hover:border-zap hover:-translate-y-0.5' : 'opacity-50'
              }`}
            >
              <h2 className="font-display text-lg font-semibold">{game.title}</h2>
              <p className="mt-1 text-sm text-muted">{game.description}</p>
              {!playable && (
                <span className="mt-3 inline-block rounded-full bg-surface2 px-3 py-1 text-xs font-mono text-muted">
                  Coming soon
                </span>
              )}
            </div>
          );

          return playable ? (
            <Link key={game.slug} to={`/games/${game.slug}`}>
              {card}
            </Link>
          ) : (
            <div key={game.slug}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
