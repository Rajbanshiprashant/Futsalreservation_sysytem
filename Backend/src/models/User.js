const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  isverified: { type: Boolean, default: false },
  otp: { type: Number, default: null },
  expiredin: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
