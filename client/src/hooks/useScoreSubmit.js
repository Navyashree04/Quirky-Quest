import { useCallback, useState } from 'react';
import { scoreApi } from '../api/endpoints';
import { useAuth } from './useAuth';

/**
 * Returns a submit(score, durationSeconds) function each game calls once,
 * on game-over. Guests skip the network call entirely — the caller can use
 * `promptSignUp` to nudge them, per the spec's "guest mode" requirement.
 */
export function useScoreSubmit(game) {
  const { isAuthenticated } = useAuth();
  const [rank, setRank] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const submit = useCallback(
    async (score, durationSeconds = 0) => {
      setRank(null);
      setSubmitError(null);

      if (!isAuthenticated) {
        return { skipped: true, promptSignUp: true };
      }

      setSubmitting(true);
      try {
        const res = await scoreApi.submit({ game, score, durationSeconds });
        setRank(res.data.rank);
        return { skipped: false, rank: res.data.rank };
      } catch (err) {
        setSubmitError(err.response?.data?.error || 'Could not save your score.');
        return { skipped: false, error: true };
      } finally {
        setSubmitting(false);
      }
    },
    [game, isAuthenticated]
  );

  return { submit, rank, submitting, submitError, isAuthenticated };
}
