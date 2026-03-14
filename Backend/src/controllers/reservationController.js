const {isFuture} = require("date-fns");
const Reservation = require('../models/Reservation');
const Court = require('../models/Court');
const asyncHandler = require('../utils/asyncHandler');

const createReservation = asyncHandler(async (req, res) => {
  const { name, date, startTime, endTime, contact, courtId, totalPrice, days = 1 } = req.body;
  
  if (!name || !date || !startTime || !endTime || !contact || !courtId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const numDays = parseInt(days, 10) || 1;
  const formattedStartTime = startTime.split(':').map(comp => comp.padStart(2, '0')).join(':');
  const formattedEndTime = endTime.split(':').map(comp => comp.padStart(2, '0')).join(':');

  if(!isFuture(new Date(date))){
    return res.status(400).json({error:"Invalid Date for reservation"});
  }

  // Check if court exists and is available
  const court = await Court.findById(courtId);
  if (!court) {
    return res.status(404).json({ error: 'Court not found' });
  }

  if (!court.available || court.maintenanceMode) {
    return res.status(400).json({ error: 'Court is not available for booking' });
  }

  // Generate all dates needed for the booking
  const bookingDates = [];
  const baseDate = new Date(date);
  for (let i = 0; i < numDays; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    bookingDates.push(d);
  }

  /* 
   * ALGORITHM: Interval Scheduling (Collision Detection)
   * 
   * This algorithm checks for overlapping intervals to prevent double-booking.
   * Two intervals (Existing and New) overlap if and only if:
   * (Existing.startTime < New.endTime) AND (Existing.endTime > New.startTime)
   * 
   * We run this linear scan (O(N) operation per day) against the database for every 
   * requested week to guarantee that no conflicting reservations exist in the system.
   */
  const conflicts = await Promise.all(bookingDates.map(d => {
    return Reservation.findOne({ 
      court: courtId, 
      date: d,
      $or: [
        { startTime: { $lt: formattedEndTime }, endTime: { $gt: formattedStartTime } }
      ]
    });
  }));

  const hasConflict = conflicts.some(c => c !== null);
  
  if(hasConflict){
    return res.status(409).json({error:`Selected time slot is already booked for one or more of the selected days.`});
  }

  // Create all reservations
  const reservationsToCreate = bookingDates.map(d => ({
    name,
    date: d,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    contact,
    court: courtId,
    user: req.user.id,
    totalPrice: (totalPrice || court.hourlyRate) / numDays // distribute total price evenly for record keeping
  }));

  const reservations = await Reservation.insertMany(reservationsToCreate);

  // For response, just return the first one populated
  const firstReservation = reservations[0];
  await firstReservation.populate('user', 'username email');
  await firstReservation.populate('court', 'name type location');

  return res.status(201).json({ 
    message: numDays > 1 ? `Successfully booked for ${numDays} consecutive days` : 'Reservation saved', 
    reservation: firstReservation, 
    allReservations: reservations 
  });
});

const getReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user.id })
    .populate('court', 'name type location hourlyRate')
    .sort({ createdAt: -1 });
  return res.json(reservations);
});

// Allow a user to cancel their own pending reservation
const cancelReservationUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const reservation = await Reservation.findById(id);

  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  // Ensure the user owns this reservation
  if (reservation.user.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to cancel this booking' });
  }

  // Only allow cancelling if it's pending
  if (reservation.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending bookings can be cancelled' });
  }

  reservation.status = 'cancelled';
  await reservation.save();

  return res.json({ message: 'Reservation cancelled successfully', reservation });
});

module.exports = { createReservation, getReservations, cancelReservationUser };
