const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  getProfile,
  uploadAvatar,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', loginUser);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile/avatar', authMiddleware, uploadAvatar);

module.exports = router;
