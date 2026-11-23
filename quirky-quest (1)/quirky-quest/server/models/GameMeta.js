const mongoose = require('mongoose');
const { GAME_SLUGS } = require('./Score');

const gameMetaSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      enum: GAME_SLUGS,
      required: true,
      unique: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    // Lower difficulty = build/play it first; matches the spec's suggested build order.
    difficulty: { type: Number, min: 1, max: 6, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameMeta', gameMetaSchema);
