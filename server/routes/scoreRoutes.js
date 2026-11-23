const express = require('express');
const scoreController = require('../controllers/scoreController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { submitScoreSchema } = require('../validators/scoreSchemas');
const { scoreSubmitLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Order matters: /leaderboard/overall must be registered before /leaderboard/:game
// or Express will try to match "overall" as a :game param.
router.get('/leaderboard/overall', scoreController.getOverallLeaderboard);
router.get('/leaderboard/:game', scoreController.getGameLeaderboard);

router.post(
  '/',
  requireAuth,
  scoreSubmitLimiter,
  validate(submitScoreSchema),
  scoreController.submitScore
);

module.exports = router;
