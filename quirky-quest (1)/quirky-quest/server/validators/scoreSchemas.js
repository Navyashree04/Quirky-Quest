const { z } = require('zod');
const { GAME_SLUGS } = require('../models/Score');

const submitScoreSchema = z.object({
  game: z.enum(GAME_SLUGS),
  score: z
    .number()
    .int('Score must be an integer')
    .min(0, 'Score cannot be negative')
    .max(1_000_000, 'Score exceeds the allowed maximum'),
  // Optional — lets the game shell report playtime for profile stats.
  durationSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
});

module.exports = { submitScoreSchema };
