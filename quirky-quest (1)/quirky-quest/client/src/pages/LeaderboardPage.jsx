import { useEffect, useState } from 'react';
import { scoreApi } from '../api/endpoints';
import { useLeaderboardSocket } from '../hooks/useLeaderboardSocket';

const GAMES = [
  { slug: 'overall', title: 'Overall' },
  { slug: 'rock-paper-scissors', title: 'Rock Paper Scissors' },
  { slug: 'quick-math-quiz', title: 'Quick Math Quiz' },
  { slug: 'memory-match', title: 'Memory Match' },
  { slug: 'whack-a-mole', title: 'Whack-a-Mole' },
  { slug: 'tic-tac-toe', title: 'Tic-Tac-Toe' },
  { slug: 'simon-says', title: 'Simon Says' },
];

export default function LeaderboardPage() {
  const [selected, setSelected] = useState('overall');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live updates arrive here whenever anyone's new score cracks the top 10
  // for the board currently selected.
  const liveEntries = useLeaderboardSocket(selected);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const request =
      selected === 'overall'
        ? scoreApi.getOverallLeaderboard({ limit: 20 })
        : scoreApi.getGameLeaderboard(selected, { limit: 20 });

    request
      .then((res) => {
        if (cancelled) return;
        setEntries(selected === 'overall' ? res.data.entries : res.data.entries);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the leaderboard right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  // A live push takes priority over the initial fetch once it arrives.
  const displayEntries = liveEntries || entries;

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Leaderboard</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {GAMES.map((g) => (
          <button
            key={g.slug}
            onClick={() => setSelected(g.slug)}
            className={`rounded-lg px-3 py-1.5 font-display text-sm transition ${
              selected === g.slug ? 'bg-zap text-ink' : 'bg-surface text-muted hover:bg-surface2'
            }`}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="card">
        {loading && <p className="py-8 text-center text-muted">Loading…</p>}
        {error && <p className="py-8 text-center text-coral">{error}</p>}
        {!loading && !error && displayEntries.length === 0 && (
          <p className="py-8 text-center text-muted">No scores yet — be the first!</p>
        )}
        {!loading && !error && displayEntries.length > 0 && (
          <ol className="divide-y divide-line">
            {displayEntries.map((entry, i) => (
              <li key={entry.userId || i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 font-mono text-muted">{i + 1}</span>
                  <span className="font-display">{entry.name}</span>
                </div>
                <span className="font-mono text-zap">
                  {selected === 'overall' ? entry.totalScore : entry.score}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
