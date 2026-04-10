const nodemailer = require("nodemailer");

// 1️ Create a transporter (you can use Gmail or others)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASSWORD, //  not your normal password
  },
});
module.exports = { transporter };
