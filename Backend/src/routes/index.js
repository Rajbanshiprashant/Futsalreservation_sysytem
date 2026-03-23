const express = require('express');
const authRoutes = require('./authRoutes');
const reservationRoutes = require('./reservationRoutes');
const adminRoutes = require('./adminRoutes');
const courtRoutes = require('./courtRoutes');
const paymentRoutes = require('./paymentRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/reservations', reservationRoutes);
router.use('/admin', adminRoutes);
router.use('/courts', courtRoutes);
router.use('/payment', paymentRoutes);

module.exports = router;
