const express = require('express');
const authRoutes = require('./authRoutes');
const reservationRoutes = require('./reservationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/reservations', reservationRoutes);

module.exports = router;
