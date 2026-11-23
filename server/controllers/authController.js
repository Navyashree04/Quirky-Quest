const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  ttlToMs,
} = require('../utils/tokens');
const env = require('../config/env');

const REFRESH_COOKIE_NAME = 'qq_refresh_token';

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: ttlToMs(env.refreshTokenTtl),
    path: '/api/auth', // only sent to auth endpoints (refresh/logout)
  });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, 'An account with that email already exists');
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({ user: user.toSafeJSON(), accessToken });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({ user: user.toSafeJSON(), accessToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      throw new ApiError(401, 'No refresh token provided');
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(payload.sub);
    if (!user || (user.tokenVersion || 0) !== (payload.tokenVersion || 0)) {
      throw new ApiError(401, 'Refresh token no longer valid');
    }

    const accessToken = signAccessToken(user);
    // Rotate the refresh token on every use to limit replay windows.
    const newRefreshToken = signRefreshToken(user);
    setRefreshCookie(res, newRefreshToken);

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, REFRESH_COOKIE_NAME };
