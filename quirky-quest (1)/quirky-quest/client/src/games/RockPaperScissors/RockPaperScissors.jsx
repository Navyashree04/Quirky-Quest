import { useState } from 'react';
import GameShell from '../../components/GameShell';
import { useScoreSubmit } from '../../hooks/useScoreSubmit';

const CHOICES = ['rock', 'paper', 'scissors'];
const EMOJI = { rock: '🪨', paper: '📄', scissors: '✂️' };
const ROUNDS_PER_GAME = 10;

const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

function judge(player, computer) {
  if (player === computer) return 'tie';
  return BEATS[player] === computer ? 'win' : 'loss';
}

export default function RockPaperScissors() {
  const [round, setRound] = useState(0);
  const [wins, setWins] = useState(0);
  const [lastResult, setLastResult] = useState(null); // { player, computer, outcome }
  const [isGameOver, setIsGameOver] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const { submit, submitting, isAuthenticated } = useScoreSubmit('rock-paper-scissors');

  function handleChoice(choice) {
    if (isGameOver) return;

    const computer = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    const outcome = judge(choice, computer);
    const nextRound = round + 1;
    const nextWins = outcome === 'win' ? wins + 1 : wins;

    setLastResult({ player: choice, computer, outcome });
    setRound(nextRound);
    setWins(nextWins);

    if (nextRound >= ROUNDS_PER_GAME) {
      setIsGameOver(true);
      submit(nextWins).then(setSubmitResult);
    }
  }

  function handleRestart() {
    setRound(0);
    setWins(0);
    setLastResult(null);
    setIsGameOver(false);
    setSubmitResult(null);
  }

  return (
    <GameShell
      title="Rock Paper Scissors"
      score={wins}
      onRestart={handleRestart}
      isGameOver={isGameOver}
      gameOverMessage={`You won ${wins} of ${ROUNDS_PER_GAME} rounds`}
    >
      <div className="flex flex-col items-center gap-6">
        <p className="font-mono text-sm text-muted">
          Round {Math.min(round + 1, ROUNDS_PER_GAME)} of {ROUNDS_PER_GAME}
        </p>

        {lastResult && (
          <div className="flex items-center gap-6 text-4xl">
            <span>{EMOJI[lastResult.player]}</span>
            <span className="font-display text-sm text-muted">vs</span>
            <span>{EMOJI[lastResult.computer]}</span>
          </div>
        )}

        {lastResult && (
          <p
            className={`font-display text-lg ${
              lastResult.outcome === 'win'
                ? 'text-zap'
                : lastResult.outcome === 'loss'
                ? 'text-coral'
                : 'text-muted'
            }`}
          >
            {lastResult.outcome === 'win' && 'You win this round!'}
            {lastResult.outcome === 'loss' && 'Computer wins this round.'}
            {lastResult.outcome === 'tie' && "It's a tie."}
          </p>
        )}

        <div className="flex gap-4">
          {CHOICES.map((choice) => (
            <button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={isGameOver}
              className="btn-secondary flex h-20 w-20 flex-col items-center justify-center gap-1 !rounded-full text-3xl disabled:opacity-40"
            >
              {EMOJI[choice]}
            </button>
          ))}
        </div>

        {isGameOver && !isAuthenticated && (
          <p className="rounded-lg bg-surface2 px-4 py-2 text-sm text-muted">
            Sign up to save this score to the leaderboard next time.
          </p>
        )}
        {isGameOver && isAuthenticated && submitting && (
          <p className="text-sm text-muted">Saving your score…</p>
        )}
        {isGameOver && isAuthenticated && submitResult?.rank && (
          <p className="text-sm text-zap">Ranked #{submitResult.rank} on the leaderboard!</p>
        )}
        {isGameOver && isAuthenticated && submitResult?.error && (
          <p className="text-sm text-coral">Couldn&apos;t save your score — check your connection.</p>
        )}
      </div>
    </GameShell>
  );
}
