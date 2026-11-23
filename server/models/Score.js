const mongoose = require('mongoose');

const GAME_SLUGS = [
  'rock-paper-scissors',
  'quick-math-quiz',
  'memory-match',
  'whack-a-mole',
  'tic-tac-toe',
  'simon-says',
];

const scoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    game: {
      type: String,
      enum: GAME_SLUGS,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Powers "top N scores for a game" leaderboard queries without a collection scan.
scoreSchema.index({ game: 1, score: -1 });
// Powers "this user's best scores" lookups on the profile page.
scoreSchema.index({ userId: 1, game: 1, score: -1 });

module.exports = mongoose.model('Score', scoreSchema);
module.exports.GAME_SLUGS = GAME_SLUGS;
