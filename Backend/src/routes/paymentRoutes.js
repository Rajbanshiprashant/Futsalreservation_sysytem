const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { KHALTI_SECRET_KEY, FRONTEND_URL } = require('../config/env');
const Reservation = require('../models/Reservation');

// ──────────────────────────────────────────────
// POST /api/payment/initiate
// Requires: Authorization token, reservationId in body
// Initiates Khalti payment and returns payment_url
// ──────────────────────────────────────────────
router.post('/initiate', authMiddleware, asyncHandler(async (req, res) => {
  const { reservationIds, reservationId } = req.body;

  // Support either single ID (legacy) or array of IDs (multi-day booking)
  const ids = reservationIds || (reservationId ? [reservationId] : []);

  if (ids.length === 0) {
    return res.status(400).json({ error: 'reservationIds is required' });
  }

  const reservations = await Reservation.find({ _id: { $in: ids } })
    .populate('user', 'username email')
    .populate('court', 'name');

  if (reservations.length === 0) {
    return res.status(404).json({ error: 'Reservations not found' });
  }

  // Ensure only reservation owner can pay
  if (reservations[0].user._id.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Sum up the total price across all the matched booking segments
  const totalSum = reservations.reduce((sum, r) => sum + r.totalPrice, 0);
  const amountPaisa = Math.round(totalSum * 100); // NPR to paisa (must be integer)

  // Setup Khalti metadata
  const firstRes = reservations[0];

  // Khalti requires a valid phone number (10 digits) — use a fallback if invalid
  const rawPhone = (firstRes.contact || '').replace(/\D/g, '');
  const customerPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9800000000';

  const khaltiPayload = {
    return_url: `${FRONTEND_URL}/payment/success`,
    website_url: FRONTEND_URL,
    amount: amountPaisa,
    purchase_order_id: firstRes._id.toString(),
    purchase_order_name: `Futsal Booking (${reservations.length} days) - ${firstRes.court?.name || 'Court'}`,
    customer_info: {
      name: firstRes.name || 'Customer',
      email: firstRes.user?.email || 'customer@himalayan.com',
      phone: customerPhone,
    },
  };

  console.log('Khalti payload:', JSON.stringify(khaltiPayload, null, 2));

  const khaltiResponse = await fetch('https://dev.khalti.com/api/v2/epayment/initiate/', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(khaltiPayload),
  });

  if (!khaltiResponse.ok) {
    const errData = await khaltiResponse.json().catch(() => ({}));
    console.error('Khalti initiate error:', JSON.stringify(errData, null, 2));
    return res.status(502).json({ error: 'Failed to initiate Khalti payment', details: errData });
  }

  const khaltiData = await khaltiResponse.json();

  // Store pidx on ALL reservations in the chain for verification later
  for (const r of reservations) {
    r.pidx = khaltiData.pidx;
    await r.save();
  }

  return res.json({
    payment_url: khaltiData.payment_url,
    pidx: khaltiData.pidx,
    expires_at: khaltiData.expires_at,
  });
}));

// ──────────────────────────────────────────────
// POST /api/payment/verify
// Called after user returns from Khalti
// Body: { pidx }
// ──────────────────────────────────────────────
router.post('/verify', authMiddleware, asyncHandler(async (req, res) => {
  const { pidx } = req.body;

  if (!pidx) {
    return res.status(400).json({ error: 'pidx is required' });
  }

  // Lookup payment status from Khalti
  const lookupResponse = await fetch('https://dev.khalti.com/api/v2/epayment/lookup/', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pidx }),
  });

  if (!lookupResponse.ok) {
    const errData = await lookupResponse.json().catch(() => ({}));
    return res.status(502).json({ error: 'Failed to verify payment', details: errData });
  }

  const lookupData = await lookupResponse.json();

  // Find ALL reservations linked to this payment pidx
  const reservations = await Reservation.find({ pidx });

  if (!reservations || reservations.length === 0) {
    return res.status(404).json({ error: 'Reservation not found for this payment' });
  }

  if (lookupData.status === 'Completed') {
    // Confirm all segments of the booking
    for (const r of reservations) {
      r.status = 'confirmed';
      r.transactionId = lookupData.transaction_id;
      await r.save();
    }

    return res.json({
      success: true,
      message: 'Payment verified and reservations confirmed!',
      transactionId: lookupData.transaction_id,
      reservations,
    });
  }

  return res.status(400).json({
    success: false,
    message: `Payment not completed. Status: ${lookupData.status}`,
    status: lookupData.status,
  });
}));

module.exports = router;
