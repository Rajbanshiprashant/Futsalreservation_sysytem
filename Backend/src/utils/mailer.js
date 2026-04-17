const nodemailer = require('nodemailer');
const { MAIL_USER, MAIL_PASS } = require('../config/env');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: MAIL_USER, pass: MAIL_PASS },
});

// Verify SMTP connection on startup so credential errors are caught immediately
transporter.verify((err) => {
  if (err) {
    console.error('❌ Mailer SMTP connection failed:', err.message);
  } else {
    console.log('✅ Mailer SMTP ready — Gmail connected as', MAIL_USER);
  }
});

/* ── Internal helper ──────────────────────────── */
const send = async (to, subject, html) => {
  if (!to) {
    console.error('❌ Email send skipped — recipient address is empty');
    return;
  }
  console.log(`📧 Attempting to send email to: ${to}`);
  try {
    const info = await transporter.sendMail({
      from: `"Himalayan Futsal" <${MAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to} — messageId: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Email send FAILED to ${to}:`, err.message, err.code || '');
    throw err; // re-throw so callers know it failed
  }
};

/* ── Shared styles ───────────────────────────── */
const font = `font-family:'Segoe UI',Arial,sans-serif;`;
const card = `max-width:520px;margin:40px auto;background:#221910;border-radius:20px;overflow:hidden;border:1px solid #3d3020;box-shadow:0 20px 60px rgba(0,0,0,.5);`;
const footer = `background:#120e08;padding:18px 36px;text-align:center;font-size:12px;color:#5a4a3a;border-top:1px solid #2d2218;`;
const tl = `color:#7a6a5a;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.06em;`;
const tv = `color:#f5ede4;font-weight:600;margin-top:3px;font-size:14px;`;
const sep = `border:none;border-bottom:1px solid #2d2218;margin:0;`;
const row = (label, value) => `
  <tr>
    <td style="padding:11px 0;${sep}">
      <div style="${tl}">${label}</div>
      <div style="${tv}">${value}</div>
    </td>
  </tr>`;
const row2 = (l1, v1, l2, v2) => `
  <tr>
    <td style="padding:11px 0;${sep};width:50%">
      <div style="${tl}">${l1}</div>
      <div style="${tv}">${v1}</div>
    </td>
    <td style="padding:11px 0;${sep};text-align:right">
      <div style="${tl}">${l2}</div>
      <div style="${tv}">${v2}</div>
    </td>
  </tr>`;

/* ═══════════════════════════════════════════════
   BOOKING CONFIRMED EMAIL
════════════════════════════════════════════════ */
/**
 * sendBookingConfirmedEmail
 * Accepts either a single reservation OR an array of reservations.
 * When multiple reservations are passed (multi-slot / multi-day booking)
 * a single summary email is sent listing all slots instead of one email per slot.
 */
const sendBookingConfirmedEmail = async (email, { reservation, reservations: allRes, court, username }) => {
  // Normalise: always work with an array
  const resList = allRes && allRes.length > 0 ? allRes : [reservation];
  const first = resList[0];
  const totalPaid = resList.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const ticketId = first._id.toString().toUpperCase().slice(-8);
  const isMulti = resList.length > 1;

  // Build one table row per reservation slot
  const slotRows = resList.map((r, i) => {
    const dateStr = new Date(r.date).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
    const bg = i % 2 === 0 ? '#1a1209' : '#211508';
    return `
      <tr style="background:${bg};">
        <td style="padding:9px 10px;color:#f5ede4;font-size:13px;border-bottom:1px solid #2d2218;">${dateStr}</td>
        <td style="padding:9px 10px;color:#f97316;font-size:13px;text-align:center;border-bottom:1px solid #2d2218;">${r.startTime} – ${r.endTime}</td>
        <td style="padding:9px 10px;color:#34d399;font-size:13px;text-align:right;border-bottom:1px solid #2d2218;">NPR ${Math.round(r.totalPrice)}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#18120a;${font}">
<div style="${card}">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#f97316,#ea6a0a);padding:32px 36px 24px;text-align:center;">
    <div style="font-size:40px;margin-bottom:8px;">⚽</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Booking Confirmed!</h1>
    <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:14px;">${isMulti ? `${resList.length} slots booked — see you on the pitch!` : 'Your futsal court is locked in. See you on the pitch!'}</p>
  </div>

  <!-- Ticket ID -->
  <div style="background:#2d1c0e;text-align:center;padding:12px 36px;border-bottom:1px solid #3d3020;">
    <div style="color:#9b8d7d;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;">Booking Reference</div>
    <div style="color:#f97316;font-size:22px;font-weight:800;letter-spacing:.1em;margin-top:2px;">#${ticketId}</div>
  </div>

  <!-- Body -->
  <div style="padding:28px 36px;">
    <p style="color:#c4b09a;margin:0 0 20px;font-size:14px;">Hi <strong style="color:#f5ede4;">${username || 'Player'}</strong>, your reservation${isMulti ? 's are' : ' is'} confirmed. Please arrive 10 minutes early. 🏆</p>

    <!-- Court info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
      ${row2('🏟️ Court', court.name, 'Type', `<span style="text-transform:capitalize;color:#f97316;">${court.type}</span>`)}
      ${row('📍 Location', court.location)}
      ${row2('👤 Player', first.name, '📞 Contact', first.contact)}
    </table>

    <!-- Slots table -->
    <p style="color:#7a6a5a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;">Booked Slots (${resList.length})</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:#2d1c0e;">
          <th style="padding:8px 10px;color:#9b8d7d;font-size:11px;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Date</th>
          <th style="padding:8px 10px;color:#9b8d7d;font-size:11px;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Time</th>
          <th style="padding:8px 10px;color:#9b8d7d;font-size:11px;text-align:right;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Amount</th>
        </tr>
      </thead>
      <tbody>${slotRows}</tbody>
    </table>

    <!-- Total paid box -->
    <div style="margin-top:16px;background:#1a1209;border-radius:12px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;">
      <span style="color:#9b8d7d;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Total Paid</span>
      <span style="color:#f97316;font-size:22px;font-weight:800;">NPR ${Math.round(totalPaid)}</span>
    </div>

    <!-- Status badge -->
    <div style="margin-top:14px;padding:12px 16px;background:#1a2d1a;border:1px solid rgba(52,211,153,.25);border-radius:10px;">
      <p style="margin:0;color:#34d399;font-size:13px;font-weight:600;">✅ Payment Verified &nbsp;·&nbsp; Status: CONFIRMED</p>
      ${first.transactionId ? `<p style="margin:4px 0 0;color:#5a8a5a;font-size:11px;">Transaction ID: ${first.transactionId}</p>` : ''}
    </div>
    <div style="height:1px;background:#2d2218;margin:14px 0 0;"></div>
  </div>

  <!-- Contact Section -->
  <div style="padding:20px 36px 24px;">
    <p style="color:#7a6a5a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px;">Questions? Contact Us Directly</p>
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:7px 0;border-bottom:1px solid #2d2218;">
          <span style="color:#5a4a3a;font-size:12px;">📞 Phone</span>
          <a href="tel:+9779826953695" style="display:block;color:#f5ede4;font-size:14px;font-weight:600;text-decoration:none;margin-top:2px;">+977 982-695-3695</a>
        </td>
      </tr>
      <tr>
        <td style="padding:7px 0;">
          <span style="color:#5a4a3a;font-size:12px;">✉️ Email</span>
          <a href="mailto:${MAIL_USER}" style="display:block;color:#f97316;font-size:14px;font-weight:600;text-decoration:none;margin-top:2px;">${MAIL_USER}</a>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="${footer}">
    ⚽ Himalayan Futsal &nbsp;·&nbsp; Kathmandu, Nepal
    <br>Please arrive 10 minutes before your slot.
  </div>
</div>
</body></html>`;

  const subject = isMulti
    ? `✅ ${resList.length} Bookings Confirmed — ${court.name} · NPR ${Math.round(totalPaid)}`
    : `✅ Booking Confirmed — ${court.name} · ${first.startTime}–${first.endTime}`;

  await send(email, subject, html);
};

/* ═══════════════════════════════════════════════
   BOOKING CANCELLED EMAIL
════════════════════════════════════════════════ */
const sendBookingCancelledEmail = async (email, { reservation, court, username, refundAmount, cancellationFee }) => {
  const dateStr = new Date(reservation.date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const ticketId = reservation._id.toString().toUpperCase().slice(-8);
  const original = Math.round(reservation.totalPrice);
  const fee = Math.round(cancellationFee);
  const refund = Math.round(refundAmount);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#18120a;${font}">
<div style="${card}">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b);padding:32px 36px 24px;text-align:center;">
    <div style="font-size:40px;margin-bottom:8px;">❌</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Booking Cancelled</h1>
    <p style="color:rgba(255,255,255,.75);margin:6px 0 0;font-size:14px;">Your refund is being processed.</p>
  </div>

  <!-- Ticket ID -->
  <div style="background:#2d1c0e;text-align:center;padding:12px 36px;border-bottom:1px solid #3d3020;">
    <div style="color:#9b8d7d;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;">Cancelled Booking ID</div>
    <div style="color:#f87171;font-size:22px;font-weight:800;letter-spacing:.1em;margin-top:2px;">#${ticketId}</div>
  </div>

  <!-- Body -->
  <div style="padding:28px 36px;">
    <p style="color:#c4b09a;margin:0 0 20px;font-size:14px;">Hi <strong style="color:#f5ede4;">${username || 'Player'}</strong>, your booking has been cancelled. Here's a summary of your refund.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row2('🏟️ Court', court.name, 'Type', `<span style="text-transform:capitalize;color:#f97316;">${court.type}</span>`)}
      ${row('📍 Location', court.location)}
      ${row('📅 Date (Cancelled)', dateStr)}
      ${row2('🕐 Start', reservation.startTime, '🏁 End', reservation.endTime)}
    </table>

    <!-- Refund Breakdown -->
    <div style="margin-top:20px;background:#1a1209;border-radius:14px;padding:16px 18px;border:1px solid #2d2218;">
      <p style="margin:0 0 12px;color:#9b8d7d;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Refund Breakdown</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:5px 0;color:#c4b09a;font-size:13px;">Original Amount</td>
          <td style="text-align:right;color:#c4b09a;font-size:13px;">NPR ${original}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#f87171;font-size:13px;">Cancellation Fee (20%)</td>
          <td style="text-align:right;color:#f87171;font-size:13px;">− NPR ${fee}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:8px 0 0;border-top:1px solid #2d2218;"></td>
        </tr>
        <tr>
          <td style="color:#34d399;font-weight:700;font-size:15px;">💰 You Get Back</td>
          <td style="text-align:right;color:#34d399;font-weight:800;font-size:20px;">NPR ${refund}</td>
        </tr>
      </table>
    </div>

    <div style="margin-top:14px;padding:12px 16px;background:#1a2a20;border:1px solid rgba(52,211,153,.2);border-radius:10px;">
      <p style="margin:0;color:#6bbf9d;font-size:13px;">⏳ Your refund will be processed within <strong>5–7 business days</strong> to your original payment method.</p>
    </div>

    <!-- Divider -->
    <div style="height:1px;background:#2d2218;margin:20px 0 0;"></div>
  </div>

  <!-- Contact Section -->
  <div style="padding:20px 36px 24px;">
    <p style="color:#7a6a5a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px;">Questions About Your Refund? Contact Us</p>
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:7px 0;border-bottom:1px solid #2d2218;">
          <span style="color:#5a4a3a;font-size:12px;">📞 Phone</span>
          <a href="tel:+9779826953695" style="display:block;color:#f5ede4;font-size:14px;font-weight:600;text-decoration:none;margin-top:2px;">+977 982-695-3695</a>
        </td>
      </tr>
      <tr>
        <td style="padding:7px 0;">
          <span style="color:#5a4a3a;font-size:12px;">✉️ Email</span>
          <a href="mailto:${MAIL_USER}" style="display:block;color:#f97316;font-size:14px;font-weight:600;text-decoration:none;margin-top:2px;">${MAIL_USER}</a>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="${footer}">
    ⚽ Himalayan Futsal &nbsp;·&nbsp; Kathmandu, Nepal
    <br>Refunds processed within 5–7 business days.
  </div>
</div>
</body></html>`;

  await send(
    email,
    `❌ Booking Cancelled & Refund Initiated — #${ticketId}`,
    html
  );
};

/* ═══════════════════════════════════════════════
   OTP EMAIL — with contact details
════════════════════════════════════════════════ */
const sendOtpEmail = async (email, otp) => {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#18120a;${font}">
<div style="${card}">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#f97316,#ea6a0a);padding:28px 36px 20px;text-align:center;">
    <div style="font-size:38px;margin-bottom:6px;">⚽</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Verify Your Account</h1>
    <p style="color:rgba(255,255,255,.8);margin:5px 0 0;font-size:13px;">Himalayan Futsal — Email Verification</p>
  </div>

  <!-- OTP Box -->
  <div style="padding:32px 36px;text-align:center;">
    <p style="color:#c4b09a;font-size:14px;margin:0 0 20px;">Use the OTP below to verify your email address. It expires in <strong style="color:#f97316;">5 minutes</strong>.</p>

    <div style="display:inline-block;background:#1a1209;border:2px dashed #f97316;border-radius:16px;padding:18px 40px;margin-bottom:24px;">
      <div style="color:#9b8d7d;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;">Your OTP</div>
      <div style="color:#f97316;font-size:38px;font-weight:800;letter-spacing:.18em;">${otp}</div>
    </div>

    <p style="color:#5a4a3a;font-size:12px;margin:0;">Do not share this code with anyone. Himalayan Futsal will never ask for your OTP.</p>
  </div>

  <!-- Divider -->
  <div style="height:1px;background:#2d2218;margin:0 36px;"></div>

  <!-- Contact Section -->
  <div style="padding:22px 36px 28px;">
    <p style="color:#7a6a5a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 14px;">Need Help? Contact Us Directly</p>
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2d2218;">
          <span style="color:#5a4a3a;font-size:12px;">📞 Phone</span>
          <a href="tel:+9779826953695" style="display:block;color:#f5ede4;font-size:14px;font-weight:600;text-decoration:none;margin-top:2px;">+977 980-000-0000</a>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#5a4a3a;font-size:12px;">✉️ Email</span>
          <a href="mailto:${MAIL_USER}" style="display:block;color:#f97316;font-size:14px;font-weight:600;text-decoration:none;margin-top:2px;">${MAIL_USER}</a>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="${footer}">
    ⚽ Himalayan Futsal &nbsp;·&nbsp; Kathmandu, Nepal
    <br>This is an automated message, please do not reply directly to this email.
  </div>
</div>
</body></html>`;

  try {
    const info = await transporter.sendMail({
      from: `"Himalayan Futsal" <${MAIL_USER}>`,
      to: email,
      subject: ' OTP Verification — Himalayan Futsal',
      html,
    });
    console.log(` OTP email sent to ${email} — messageId: ${info.messageId}`);
  } catch (error) {
    console.error(' Error sending OTP email:', error.message);
    throw new Error('Unable to send OTP email');
  }
};


module.exports = { sendOtpEmail, sendBookingConfirmedEmail, sendBookingCancelledEmail };
