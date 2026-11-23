const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never return by default
    },
    avatar: {
      type: String,
      default: '',
    },
    // Bumped on password change / logout-everywhere to invalidate old refresh tokens.
    tokenVersion: {
      type: Number,
      default: 0,
    },
    stats: {
      gamesPlayed: { type: Number, default: 0 },
      totalPlaytimeSeconds: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.statics.hashPassword = async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
};

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    stats: this.stats,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
