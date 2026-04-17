const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const Reservation = require('../models/Reservation');
const { sendBookingConfirmedEmail } = require('../utils/mailer');

// ── Stripe Configuration ───────────────────────────────────────────────────
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('💳 Stripe payment mode active');

// ──────────────────────────────────────────────────────────────────────────
// POST /api/payment/initiate
// Body: { reservationIds: [...] }  OR  { reservationId: "..." }  (legacy)
// Returns: { payment_url, sessionId }
// ──────────────────────────────────────────────────────────────────────────
router.post('/initiate', authMiddleware, asyncHandler(async (req, res) => {
  const { reservationIds, reservationId } = req.body;

  // Support single ID (legacy) or array
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

  // Only the owner can pay
  if (reservations[0].user._id.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Total in smallest unit (paisa for NPR, cents for USD)
  const totalNPR = reservations.reduce((sum, r) => sum + r.totalPrice, 0);
  // Stripe requires amount in smallest currency unit
  const amountPaisa = Math.round(totalNPR * 100);

  const courtName = reservations[0].court?.name || 'Futsal Court';
  const slotCount = reservations.length;

  console.log(`📤 Creating Stripe Checkout Session: NPR ${totalNPR} for ${slotCount} slot(s)`);

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'npr',
          product_data: {
            name: `Futsal Booking – ${courtName}`,
            description: `${slotCount} slot(s) at ${courtName}`,
          },
          unit_amount: amountPaisa,
        },
        quantity: 1,
      },
    ],
    customer_email: reservations[0].user?.email || undefined,
    success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/payment?cancelled=true`,
    metadata: {
      reservationIds: ids.join(','),
      userId: req.user.id,
    },
  });

  console.log(`✅ Stripe session created: ${session.id}`);

  // Save session ID on all reservations for later verification
  for (const r of reservations) {
    r.stripeSessionId = session.id;
    await r.save();
  }

  return res.json({
    payment_url: session.url,
    sessionId: session.id,
  });
}));


// ──────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Body: { sessionId }
// Called after user returns from Stripe Checkout
// ──────────────────────────────────────────────────────────────────────────
router.post('/verify', authMiddleware, asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  console.log('🔍 Verifying Stripe session:', sessionId);

  // Ask Stripe to confirm payment status
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  console.log(`📥 Stripe session status: ${session.payment_status}`);

  // Find all reservations linked to this session
  const reservations = await Reservation.find({ stripeSessionId: sessionId });
  if (!reservations || reservations.length === 0) {
    return res.status(404).json({ error: 'No reservation found for this payment session' });
  }

  if (session.payment_status === 'paid') {
    // Mark all reservations as confirmed
    for (const r of reservations) {
      r.status = 'confirmed';
      r.transactionId = session.payment_intent;
      await r.save();
    }

    // Send ONE confirmation email (guard against duplicate sends on page refresh)
    const alreadySent = reservations.some(r => r.confirmationEmailSent === true);
    if (!alreadySent) {
      try {
        await Reservation.updateMany({ stripeSessionId: sessionId }, { $set: { confirmationEmailSent: true } });

        const first = await Reservation.findById(reservations[0]._id)
          .populate('user', 'username email')
          .populate('court', 'name type location');

        if (first?.user?.email) {
          const allPopulated = await Promise.all(
            reservations.map(r =>
              Reservation.findById(r._id).populate('court', 'name type location')
            )
          );
          await sendBookingConfirmedEmail(first.user.email, {
            reservations: allPopulated,
            court: first.court,
            username: first.user.username,
          });
          console.log(`✅ Confirmation email sent to ${first.user.email}`);
        }
      } catch (emailErr) {
        console.error('❌ Email error:', emailErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Payment verified! Reservations confirmed.',
      transactionId: session.payment_intent,
      reservations,
    });
  }

  return res.status(400).json({
    success: false,
    message: `Payment not completed. Status: ${session.payment_status}`,
    status: session.payment_status,
  });
}));

module.exports = router;
