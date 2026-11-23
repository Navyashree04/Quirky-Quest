const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    env.accessTokenSecret,
    { expiresIn: env.accessTokenTtl }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), tokenVersion: user.tokenVersion || 0 },
    env.refreshTokenSecret,
    { expiresIn: env.refreshTokenTtl }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.accessTokenSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshTokenSecret);
}

// Parses a duration string like "7d" / "15m" into milliseconds for cookie maxAge.
function ttlToMs(ttl) {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 15 * 60 * 1000; // sane default: 15 minutes
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * multipliers[unit];
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ttlToMs,
};
