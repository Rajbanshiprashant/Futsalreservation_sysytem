const { isFuture } = require("date-fns");
const Reservation = require('../models/Reservation');
const Court = require('../models/Court');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendBookingCancelledEmail } = require('../utils/mailer');

const createReservation = asyncHandler(async (req, res) => {
  const { name, date, startTime, endTime, contact, courtId, totalPrice, days = 1 } = req.body;

  if (!name || !date || !startTime || !endTime || !contact || !courtId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const numDays = parseInt(days, 10) || 1;
  const formattedStartTime = startTime.split(':').map(comp => comp.padStart(2, '0')).join(':');
  const formattedEndTime = endTime.split(':').map(comp => comp.padStart(2, '0')).join(':');

  // Validate that startTime < endTime and duration is at least 1 hour
  const [sh, sm] = formattedStartTime.split(':').map(Number);
  const [eh, em] = formattedEndTime.split(':').map(Number);
  const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (durationMinutes < 60) {
    return res.status(400).json({ error: 'Booking duration must be at least 1 hour and end time must be after start time.' });
  }

  const bookingDateStr = new Date(date).toISOString().slice(0, 10);
  const startDateTime = new Date(`${bookingDateStr}T${formattedStartTime}:00`);

  if (!isFuture(startDateTime)) {
    return res.status(400).json({ error: "Invalid reservation time. The selected time is in the past." });
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
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { startTime: { $lt: formattedEndTime }, endTime: { $gt: formattedStartTime } }
      ]
    });
  }));

  const hasConflict = conflicts.some(c => c !== null);

  if (hasConflict) {
    return res.status(409).json({ error: `Selected time slot is already booked for one or more of the selected days.` });
  }

  // Calculate actual price based on duration hours
  const durationHours = durationMinutes / 60;
  const pricePerDay = totalPrice ? (totalPrice / numDays) : (court.hourlyRate * durationHours);

  // Create all reservations
  const reservationsToCreate = bookingDates.map(d => ({
    name,
    date: d,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    contact,
    court: courtId,
    user: req.user.id,
    totalPrice: Math.round(pricePerDay)
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

// Allow a user to cancel their own booking (pending or confirmed)
// Rules:
//   - Must be cancelled at least 12 hours before the booking start time
//   - A 20% cancellation fee is deducted; 80% is marked as refund
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

  // Only allow cancelling if it's pending or confirmed
  if (!['pending', 'confirmed'].includes(reservation.status)) {
    return res.status(400).json({ error: 'Only pending or confirmed bookings can be cancelled' });
  }

  /* ── 12-Hour Deadline Check ─────────────────────────────────────────────
   * Combine the reservation date (YYYY-MM-DD) and startTime (HH:MM) into a
   * single Date so we can compare to the current moment.
   */
  const bookingDateStr = new Date(reservation.date).toISOString().slice(0, 10);
  const bookingStart = new Date(`${bookingDateStr}T${reservation.startTime}:00`);
  const now = new Date();
  const hoursUntilBooking = (bookingStart - now) / (1000 * 60 * 60);

  if (hoursUntilBooking < 12) {
    return res.status(400).json({
      error: `Cancellations must be made at least 12 hours before your booking. Your slot starts at ${reservation.startTime} on ${bookingDateStr} — it is too late to cancel.`
    });
  }

  /* ── Refund Calculation ──────────────────────────────────────────────────
   * Deduct 20% as a cancellation fee; refund 80% of the paid price.
   */
  const cancellationFee = Math.round(reservation.totalPrice * 0.20);
  const refundAmount = Math.round(reservation.totalPrice * 0.80);

  reservation.status = 'cancelled';
  reservation.cancelledAt = now;
  reservation.refundAmount = refundAmount;
  await reservation.save();

  // ── Send cancellation email (fire-and-forget) ──
  try {
    const [userDoc, courtDoc] = await Promise.all([
      User.findById(reservation.user).select('email username'),
      Court.findById(reservation.court).select('name type location'),
    ]);
    if (userDoc?.email) {
      sendBookingCancelledEmail(userDoc.email, {
        reservation,
        court: courtDoc || { name: 'Court', type: '', location: '' },
        username: userDoc.username,
        refundAmount,
        cancellationFee,
      }).catch(err => console.error('Cancellation email failed:', err.message));
    }
  } catch (emailErr) {
    console.error('Failed to prepare cancellation email:', emailErr.message);
  }

  return res.json({
    message: 'Reservation cancelled successfully',
    reservation,
    refund: {
      originalAmount: reservation.totalPrice,
      cancellationFee,
      refundAmount,
      note: `Your refund of NPR ${refundAmount} will be processed within 5-7 business days.`
    }
  });
});

module.exports = { createReservation, getReservations, cancelReservationUser };
