const nodemailer = require('nodemailer');
const { MAIL_USER, MAIL_PASS } = require('../config/env');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: MAIL_USER,
    to: email,
    subject: 'OTP Verification',
    html: `<p>Your OTP for verification is: <b>${otp}</b></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw new Error('Unable to send OTP email');
  }
};

module.exports = { sendOtpEmail };
