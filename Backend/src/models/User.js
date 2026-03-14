const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  isverified: { type: Boolean, default: false },
  otp: { type: Number, default: null },
  expiredin: { type: Date, default: null },
  avatar: { type: String, default: null },
  //feild for admin or user
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  //virtual feild for identifying admin or user
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

module.exports = mongoose.model('User', userSchema);
