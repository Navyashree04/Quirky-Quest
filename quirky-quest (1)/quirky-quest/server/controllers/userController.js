const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');

async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, 'User not found');
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { name, avatar } = req.body;
    const update = {};
    if (typeof name === 'string') update.name = name.trim();
    if (typeof avatar === 'string') update.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
    });
    if (!user) throw new ApiError(404, 'User not found');

    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe };
