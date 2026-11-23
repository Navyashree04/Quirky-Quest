import { useNavigate } from 'react-router-dom';

/**
 * Wraps every game with a consistent header (title, live score, optional
 * timer) and footer controls (restart / exit to menu). Games render their
 * board as `children` and report state via props rather than managing their
 * own chrome.
 */
export default function GameShell({
  title,
  score,
  timeLeft,
  onRestart,
  children,
  isGameOver,
  gameOverMessage,
}) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-mist">{title}</h1>
        <div className="flex items-center gap-4 font-mono">
          {typeof timeLeft === 'number' && (
            <span
              className={`rounded-lg border border-line px-3 py-1 text-sm ${
                timeLeft <= 5 ? 'text-coral' : 'text-muted'
              }`}
            >
              {timeLeft}s
            </span>
          )}
          <span className="rounded-lg bg-surface2 px-3 py-1 text-sm text-zap">
            Score: {score}
          </span>
        </div>
      </div>

      <div className="card min-h-[320px]">
        {isGameOver ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="font-display text-xl text-mist">{gameOverMessage || 'Game over!'}</p>
            <p className="font-mono text-3xl text-zap">{score}</p>
          </div>
        ) : (
          children
        )}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button onClick={onRestart} className="btn-primary">
          {isGameOver ? 'Play again' : 'Restart'}
        </button>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Exit to menu
        </button>
      </div>
    </div>
  );
}
