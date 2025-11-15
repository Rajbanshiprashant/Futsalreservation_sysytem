const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendOtpEmail } = require('../utils/mailer');
const { OTP_EXPIRY_MS, JWT_SECRET } = require('../config/env');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

const registerUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password, and email are required' });
  }

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    const field = existing.username === username ? 'username' : 'email';
    return res.status(409).json({ error: `${field} already in use` });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const otp = generateOtp();
  const user = new User({
    username,
    passwordHash,
    email,
    otp,
    expiredin: new Date(Date.now() + OTP_EXPIRY_MS),
  });
  await user.save();

  await sendOtpEmail(email, otp);

  return res.status(201).json({ message: 'User created. Please verify your email.' });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { username, otp } = req.body;
  if (!username || !otp) {
    return res.status(400).json({ error: 'Username and OTP are required' });
  }

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.isverified) return res.status(400).json({ error: 'User already verified' });
  if (!user.otp || !user.expiredin) {
    return res.status(400).json({ error: 'No OTP issued. Please request a new one.' });
  }

  if (user.expiredin.getTime() < Date.now()) {
    return res.status(410).json({ error: 'OTP expired. Please request a new one.' });
  }

  if (Number(otp) !== user.otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  user.isverified = true;
  user.otp = null;
  user.expiredin = null;
  await user.save();

  return res.json({ message: 'Account verified successfully' });
});

const resendOtp = asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.isverified) return res.status(400).json({ error: 'User already verified' });

  const otp = generateOtp();
  user.otp = otp;
  user.expiredin = new Date(Date.now() + OTP_EXPIRY_MS);
  await user.save();

  await sendOtpEmail(user.email, otp);

  return res.json({ message: 'OTP re-sent successfully' });
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.isverified) {
    return res.status(403).json({ error: 'Account not verified. Please verify via OTP.' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, username: user.username });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash -otp -expiredin');
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  getProfile,
};
