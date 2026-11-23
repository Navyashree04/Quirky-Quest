const GameMeta = require('../models/GameMeta');

async function listGames(req, res, next) {
  try {
    const games = await GameMeta.find().sort({ difficulty: 1 }).select('-__v').lean();
    res.json({ games });
  } catch (err) {
    next(err);
  }
}

module.exports = { listGames };
