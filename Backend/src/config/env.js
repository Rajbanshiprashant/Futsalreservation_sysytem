const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase',
  OTP_EXPIRY_MS: Number(process.env.OTP_EXPIRY_MS) || 5 * 60 * 1000,
  MAIL_USER: process.env.USER_EMAIL,
  MAIL_PASS: process.env.APP_PASSWORD,
};
