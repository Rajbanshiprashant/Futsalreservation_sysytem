const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createReservation, getReservations, cancelReservationUser } = require('../controllers/reservationController');
const Reservation = require('../models/Reservation');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * GET /api/reservations/availability?courtId=&date=
 * Public — no auth needed.
 * Returns all booked start/end times for a court on a specific date
 * so the booking UI can gray out taken slots for every user.
 */
router.get('/availability', asyncHandler(async (req, res) => {
  const { courtId, date } = req.query;

  if (!courtId || !date) {
    return res.status(400).json({ error: 'courtId and date query params are required' });
  }

  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const booked = await Reservation.find({
    court: courtId,
    date: { $gte: dayStart, $lte: dayEnd },
    status: { $in: ['pending', 'confirmed'] },
  }).select('startTime endTime -_id');

  return res.json(booked); // e.g. [{ startTime: "09:00", endTime: "11:00" }, ...]
}));

// All routes below require authentication
router.use(authMiddleware);
router.post('/', createReservation);
router.get('/', getReservations);
router.put('/:id/cancel', cancelReservationUser);

module.exports = router;
