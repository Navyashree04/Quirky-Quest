/**
 * One-off seed script for GameMeta. Run with: node scripts/seedGames.js
 * Safe to re-run — uses upsert so it won't create duplicates.
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const GameMeta = require('../models/GameMeta');
const logger = require('../utils/logger');

const games = [
  {
    slug: 'rock-paper-scissors',
    title: 'Rock Paper Scissors',
    description: 'Classic hand game against the computer.',
    difficulty: 1,
  },
  {
    slug: 'quick-math-quiz',
    title: 'Quick Math Quiz',
    description: 'Timed arithmetic — how many can you solve?',
    difficulty: 2,
  },
  {
    slug: 'memory-match',
    title: 'Memory Match',
    description: 'Flip cards and find every matching pair.',
    difficulty: 3,
  },
  {
    slug: 'whack-a-mole',
    title: 'Whack-a-Mole',
    description: 'Click the mole before it disappears.',
    difficulty: 4,
  },
  {
    slug: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    description: 'Beat the computer at the classic 3x3 grid game.',
    difficulty: 5,
  },
  {
    slug: 'simon-says',
    title: 'Simon Says',
    description: 'Repeat the growing color sequence from memory.',
    difficulty: 6,
  },
];

async function seed() {
  await mongoose.connect(env.mongoUri);
  for (const game of games) {
    await GameMeta.findOneAndUpdate({ slug: game.slug }, game, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }
  logger.info(`Seeded ${games.length} GameMeta documents`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error(`Seed failed: ${err.stack || err.message}`);
  process.exit(1);
});
