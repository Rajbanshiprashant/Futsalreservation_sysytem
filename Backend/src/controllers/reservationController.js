const Reservation = require('../models/Reservation');
const asyncHandler = require('../utils/asyncHandler');

const createReservation = asyncHandler(async (req, res) => {
  const { name, date, time, contact } = req.body;
  if (!name || !date || !time || !contact) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const reservation = await Reservation.create({
    name,
    date,
    time,
    contact,
    user: req.user.id,
  });

  return res.status(201).json({ message: 'Reservation saved', reservation });
});

const getReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user.id }).sort({ createdAt: -1 });
  return res.json(reservations);
});

module.exports = { createReservation, getReservations };
