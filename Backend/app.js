require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { transporter } = require('./sendmail');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected');

    // Start the Express server after a successful connection to MongoDB
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// User schema & model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isverified: { type: Boolean, default: false },
  otp: { type: Number, default: null},
  expiredin: { type: Date, default: null},
});

const User = mongoose.model('User', userSchema);

// Reservation Schema
const reservationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  contact: { type: String, required: true },
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password,email } = req.body;
    if (!username || !password || !email) return res.status(400).json({ error: 'Missing fields' });

    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const otp = parseInt(Math.random()*1000000);
    const user = new User({ username, passwordHash, email, otp, expiredin: new Date(Date.now() + 5*60*1000) });
    await user.save();

  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: email,
    subject: "OTP Verification",
    html: `<p>Your OTP for verification is: <b>${user.otp}</b></p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Error sending email:", error);
    } else {
      console.log("✅ Email sent:", info.response);
    }
  });


    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await User.findOne({ username,isverified:true });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST endpoint to create a reservation
app.post('/api/reservations', async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    await reservation.save();
    res.status(201).json({ message: 'Reservation saved', reservation });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send('Futsal Reservation System Backend');
});


