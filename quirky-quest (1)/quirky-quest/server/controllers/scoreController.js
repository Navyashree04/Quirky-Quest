const Score = require('../models/Score');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const cache = require('../utils/cache');
const { emitLeaderboardUpdate, emitOverallLeaderboardUpdate } = require('../sockets');
const logger = require('../utils/logger');

const LEADERBOARD_CACHE_TTL_MS = 15_000; // short TTL: leaderboards should feel live
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const BROADCAST_TOP_N = 10; // only push a socket update if the new score cracks the top 10

function parsePagination(query) {
  const limit = Math.min(parseInt(query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
}

/**
 * Fetches the top-N leaderboard for a single game.
 * Uses .lean() + the { game: 1, score: -1 } compound index so this is a
 * covered/near-covered index scan rather than a collection scan + in-memory sort.
 */
async function fetchGameLeaderboard(game, { limit, skip }) {
  return Score.find({ game })
    .select('userId score createdAt')
    .sort({ score: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name avatar') // single $in query, not N+1
    .lean();
}

async function getGameLeaderboard(req, res, next) {
  try {
    const { game } = req.params;
    const { limit, page, skip } = parsePagination(req.query);
    const cacheKey = `lb:${game}:${page}:${limit}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const entries = await fetchGameLeaderboard(game, { limit, skip });
    const payload = {
      game,
      page,
      limit,
      entries: entries.map((e) => ({
        userId: e.userId?._id,
        name: e.userId?.name || 'Deleted user',
        avatar: e.userId?.avatar || '',
        score: e.score,
        achievedAt: e.createdAt,
      })),
    };

    cache.set(cacheKey, payload, LEADERBOARD_CACHE_TTL_MS);
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

/**
 * Overall leaderboard: each user's best score per game, summed across games.
 * Aggregation pipeline avoids pulling every score document into app memory.
 */
async function getOverallLeaderboard(req, res, next) {
  try {
    const { limit, page, skip } = parsePagination(req.query);
    const cacheKey = `lb:overall:${page}:${limit}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const pipeline = [
      { $sort: { score: -1 } },
      {
        $group: {
          _id: { userId: '$userId', game: '$game' },
          bestScore: { $first: '$score' },
        },
      },
      {
        $group: {
          _id: '$_id.userId',
          totalScore: { $sum: '$bestScore' },
          gamesPlayed: { $sum: 1 },
        },
      },
      { $sort: { totalScore: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          avatar: '$user.avatar',
          totalScore: 1,
          gamesPlayed: 1,
        },
      },
    ];

    const entries = await Score.aggregate(pipeline);
    const payload = { page, limit, entries };

    cache.set(cacheKey, payload, LEADERBOARD_CACHE_TTL_MS);
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

async function submitScore(req, res, next) {
  try {
    const { game, score, durationSeconds = 0 } = req.body;
    const userId = req.user.id;

    const scoreDoc = await Score.create({ userId, game, score });

    // Fire-and-forget-ish stat update — doesn't block the response on failure,
    // but we still await it so a real error surfaces instead of silently vanishing.
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'stats.gamesPlayed': 1,
        'stats.totalPlaytimeSeconds': durationSeconds,
      },
    });

    // Invalidate cached leaderboard pages for this game + the overall board.
    cache.delByPrefix(`lb:${game}:`);
    cache.delByPrefix('lb:overall:');

    // Only pay for a leaderboard re-fetch + broadcast if this score is plausibly
    // a top-N result, using a cheap count against the compound index.
    const rank = (await Score.countDocuments({ game, score: { $gt: score } })) + 1;

    if (rank <= BROADCAST_TOP_N) {
      try {
        const updated = await fetchGameLeaderboard(game, { limit: BROADCAST_TOP_N, skip: 0 });
        emitLeaderboardUpdate(
          game,
          updated.map((e) => ({
            userId: e.userId?._id,
            name: e.userId?.name || 'Deleted user',
            avatar: e.userId?.avatar || '',
            score: e.score,
            achievedAt: e.createdAt,
          }))
        );
        // Overall leaderboard is pricier (aggregation across all games), so we
        // only recompute/broadcast it on the same top-N-worthy submissions
        // rather than on every score, keeping the common case cheap.
        const overallPipeline = [
          { $sort: { score: -1 } },
          { $group: { _id: { userId: '$userId', game: '$game' }, bestScore: { $first: '$score' } } },
          { $group: { _id: '$_id.userId', totalScore: { $sum: '$bestScore' }, gamesPlayed: { $sum: 1 } } },
          { $sort: { totalScore: -1 } },
          { $limit: BROADCAST_TOP_N },
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          { $project: { _id: 0, userId: '$_id', name: '$user.name', avatar: '$user.avatar', totalScore: 1, gamesPlayed: 1 } },
        ];
        const overallTop = await Score.aggregate(overallPipeline);
        emitOverallLeaderboardUpdate(overallTop);
      } catch (broadcastErr) {
        // A broadcast failure shouldn't fail the score-submission request.
        logger.warn(`Leaderboard broadcast failed: ${broadcastErr.message}`);
      }
    }

    res.status(201).json({
      score: {
        id: scoreDoc._id,
        game: scoreDoc.game,
        score: scoreDoc.score,
        createdAt: scoreDoc.createdAt,
      },
      rank,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return next(new ApiError(400, err.message));
    }
    next(err);
  }
}

module.exports = { submitScore, getGameLeaderboard, getOverallLeaderboard };
