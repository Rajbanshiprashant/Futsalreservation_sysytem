import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Reservations.module.css';
import { apiClient, API_BASE } from '../services/apiClient';
import { useAuth } from '../context/AuthContext.jsx';

/* ── Helpers ── */
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
];

// Add N hours to a 'HH:MM' string
function addHours(timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h + hours;
  if (total > 23) return '23:00'; // cap at 11pm
  return `${String(total).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// How many whole hours a slot can support before 22:00
function maxHoursForSlot(slot) {
  const [h] = slot.split(':').map(Number);
  return Math.max(1, Math.min(6, 22 - h));
}

function fmt12(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getNext14Days() {
  const days = [];
  const now = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push({
      label: i === 0 ? 'TODAY' : dayNames[d.getDay()],
      day: d.getDate(),
      month: monthNames[d.getMonth()],
      iso: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

const STEPS = ['Court', 'Date & Time', 'Details', 'Confirm'];

export default function Reservations() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  /* ── Dropdown State ── */
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  /* ── Form State ── */
  const [step, setStep] = useState(0);
  const [courtId, setCourtId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getNext14Days()[0].iso);
  const [selectedSlot, setSelectedSlot] = useState(''); // e.g. "08:00"
  const [durationHours, setDurationHours] = useState(1); // 1-6 hours per session
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [durationDays, setDurationDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Data ── */
  const [courts, setCourts] = useState([]);
  const [courtAvailability, setCourtAvailability] = useState([]); // booked intervals from server

  const days = useMemo(() => getNext14Days(), []);

  const selectedCourt = courts.find(c => c._id === courtId);

  /* ── Fetch ── */
  useEffect(() => {
    apiClient.get('/api/courts').then(d => setCourts(d.data || [])).catch(console.error);
  }, []);

  /* Fetch ALL bookings for the selected court+date from the public availability endpoint.
   * This runs whenever the user picks a different court or date so every user sees
   * the same accurate picture of which slots are already taken. */
  useEffect(() => {
    if (!courtId || !selectedDate) {
      setCourtAvailability([]);
      return;
    }
    apiClient
      .get(`/api/reservations/availability?courtId=${courtId}&date=${selectedDate}`)
      .then(data => setCourtAvailability(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load availability:', err);
        setCourtAvailability([]);
      });
  }, [courtId, selectedDate]);

  /* ── Booked slots: build a Set of every hour that is covered by any booking ── */
  const bookedSlots = useMemo(() => {
    const booked = new Set();
    courtAvailability.forEach(r => {
      const [sh] = (r.startTime || '').split(':').map(Number);
      const [eh] = (r.endTime || '').split(':').map(Number);
      for (let h = sh; h < eh; h++) {
        booked.add(`${String(h).padStart(2, '0')}:00`);
      }
    });
    return booked;
  }, [courtAvailability]);

  /* ── Dynamic Pricing Algorithm (Rule-Based Engine V3) ── */
  const calculateDynamicPrice = () => {
    const baseHourly = selectedCourt?.hourlyRate || 1500;
    let total = 0;
    let breakdown = [];
    let weekendCount = 0;
    let peakCount = 0;
    let peakHours = 0;

    if (!selectedDate || !selectedSlot) return { total: baseHourly * durationHours, breakdown, baseHourly };

    for (let i = 0; i < durationDays; i++) {
      let dailyMultiplier = 1;
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);

      // Rule 1: Weekend Surcharge
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dailyMultiplier *= 1.2;
        weekendCount++;
      }

      // Rule 2: Peak Hour Surcharge — check if ANY hour in the session is peak
      const startHour = parseInt(selectedSlot.split(':')[0], 10);
      let sessionHasPeak = false;
      for (let h = startHour; h < startHour + durationHours; h++) {
        if (h >= 17 && h <= 21) { sessionHasPeak = true; peakHours++; }
      }
      if (sessionHasPeak) { dailyMultiplier *= 1.5; peakCount++; }

      total += Math.round(baseHourly * durationHours * dailyMultiplier);
    }
    // peakCount and weekendCount are used to generate a clear breakdown
    if (weekendCount > 0) breakdown.push({ label: `Weekend Surcharge (x${weekendCount} days)`, value: 'x1.2' });
    if (peakCount > 0) breakdown.push({ label: `Peak Hour Surcharge (x${peakCount} days)`, value: 'x1.5' });
    if (durationHours > 1) breakdown.push({ label: `Duration`, value: `x${durationHours} hrs` });

    return {
      baseHourly,
      total,
      breakdown
    };
  };

  const pricing = useMemo(() => calculateDynamicPrice(), [selectedCourt, selectedDate, selectedSlot, durationDays, durationHours]);

  /* ── Submit — create reservation then redirect straight to Khalti ── */
  const submitReservation = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const endTime = addHours(selectedSlot, durationHours);
      const totalPrice = pricing.total;

      // 1. Create the reservation
      const data = await apiClient.post('/api/reservations', {
        token,
        body: { name, date: selectedDate, startTime: selectedSlot, endTime, contact, courtId, totalPrice, days: durationDays },
      });

      const reservationIds = data?.allReservations?.map(r => r._id);
      if (!reservationIds || reservationIds.length === 0) throw new Error('Reservation created but ID missing.');

      // 2. Initiate Stripe payment
      setMessage('Redirecting to Stripe Checkout…');
      const payData = await apiClient.post('/api/payment/initiate', {
        token,
        body: { reservationIds },
      });

      // 3. Redirect browser to Stripe Checkout page
      window.location.href = payData.payment_url;
    } catch (err) {
      setMessageType('error');
      setMessage(err.message);
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const canNext = () => {
    if (step === 0) return Boolean(courtId);
    if (step === 1) return Boolean(selectedDate && selectedSlot && durationHours >= 1 && durationDays >= 1);
    if (step === 2) return Boolean(name.trim()) && contact.trim().length >= 7;
    return true;
  };

  const endTime = selectedSlot ? addHours(selectedSlot, durationHours) : '';

  const handleNext = () => {
    if (!canNext()) return;
    if (step === 3) {
      setShowConfirm(true);
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className={styles.shell}>
      {/* ── Top Nav ── */}
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <span className={styles.navLogo}>⚽</span>
          <span>Himalayan <strong>Futsal</strong></span>
        </div>
        <div className={styles.navLinks}>
          <a className={styles.navLink} href="/">Home</a>
          <a className={`${styles.navLink} ${styles.navLinkActive}`} href="/reservations">Book Courts</a>
          <a className={styles.navLink} href="/dashboard">My Bookings</a>
        </div>
        <div className={styles.navRight}>
          <button className={styles.notifBtn} aria-label="Notifications">🔔</button>

          <div className={styles.avatarWrapper}>
            <div
              className={styles.avatar}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className={styles.avatarImgNav} />
              ) : (
                user?.username ? user.username.charAt(0).toUpperCase() : '👤'
              )}
            </div>

            {showProfileMenu && (
              <div className={styles.profileDropdown}>
                <div className={styles.dropdownHeader}>
                  <p className={styles.dropdownName}>{user?.username || 'Player'}</p>
                  <p className={styles.dropdownEmail}>{user?.email || 'No email'}</p>
                </div>
                <div className={styles.dropdownDivider} />
                {user?.role === 'admin' && (
                  <>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => navigate('/admin')}
                    >
                      Admin Dashboard
                    </button>
                    <div className={styles.dropdownDivider} />
                  </>
                )}
                <button
                  className={styles.dropdownItem}
                  onClick={() => navigate('/dashboard')}
                >
                  Profile Management
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => navigate('/dashboard')}
                >
                  Booking Details
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => navigate('/dashboard')}
                >
                  Payment Details
                </button>
                <div className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Reserve Your Court</h1>
          <span className={styles.stepLabel}>Step {step + 1} of {STEPS.length}</span>
        </div>

        {/* Step Indicator */}
        <div className={styles.stepRow}>
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className={styles.stepItem}>
                <div className={`${styles.stepCircle} ${i < step ? styles.stepDone : ''} ${i === step ? styles.stepActive : ''}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`${styles.stepName} ${i === step ? styles.stepNameActive : ''}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Content + Summary ── */}
        <div className={styles.layout}>
          {/* Left panel */}
          <div className={styles.leftPanel}>

            {/* STEP 0 — Select Court */}
            {step === 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🏟️ Select Court</h2>
                <div className={styles.courtGrid}>
                  {courts.length === 0 && <p className={styles.mutedText}>Loading courts…</p>}
                  {courts.map(court => (
                    <button
                      key={court._id}
                      className={`${styles.courtCard} ${courtId === court._id ? styles.courtCardActive : ''}`}
                      onClick={() => setCourtId(court._id)}
                    >
                      <div className={styles.courtCardTop}>
                        {court.imageUrl ? (
                          <img
                            src={court.imageUrl.startsWith('http') ? court.imageUrl : `${API_BASE}${court.imageUrl}`}
                            alt={court.name}
                            className={styles.courtImage}
                          />
                        ) : (
                          <div className={styles.courtTurf} />
                        )}
                      </div>
                      <div className={styles.courtCardBody}>
                        <p className={styles.courtName}>{court.name}</p>
                        <p className={styles.courtMeta}>{court.type} · NPR {court.hourlyRate}/hr</p>
                        <p className={styles.courtLocation}>📍 {court.location || 'Himalayan Hub'}</p>
                      </div>
                      {courtId === court._id && <span className={styles.courtCheck}>✓</span>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* STEP 1 — Date & Time */}
            {step === 1 && (
              <>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>📅 Select Date</h2>
                  <div className={styles.dateRow}>
                    {days.map(d => (
                      <button
                        key={d.iso}
                        className={`${styles.dateCard} ${selectedDate === d.iso ? styles.dateCardActive : ''}`}
                        onClick={() => { setSelectedDate(d.iso); setSelectedSlot(''); }}
                      >
                        <span className={styles.dateDayName}>{d.label}</span>
                        <span className={styles.dateDayNum}>{d.day}</span>
                        <span className={styles.dateMonth}>{d.month}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    🕐 Select Start Time
                    <span className={styles.slotLegend}>
                      <span className={styles.legendDot} style={{ background: '#f97316' }} /> Selected
                      <span className={styles.legendDot} style={{ background: '#444' }} /> Available
                      <span className={styles.legendDot} style={{ background: '#2a2a2a', border: '1px solid #444' }} /> Booked
                    </span>
                  </h2>
                  <div className={styles.slotGrid}>
                    {TIME_SLOTS.filter((slot) => {
                      const todayISO = new Date().toISOString().slice(0, 10);
                      if (selectedDate !== todayISO) return true;
                      const slotHour = parseInt(slot.split(':')[0], 10);
                      return slotHour > new Date().getHours();
                    }).map((slot) => {
                      const isBooked = bookedSlots.has(slot);
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          disabled={isBooked}
                          className={`${styles.slotBtn} ${isBooked ? styles.slotBooked : ''} ${isSelected ? styles.slotSelected : ''}`}
                          onClick={() => { setSelectedSlot(slot); setDurationHours(1); }}
                        >
                          {isBooked ? <s>{fmt12(slot)}</s> : fmt12(slot)}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {selectedSlot && (
                  <>
                    <section className={styles.section}>
                      <h2 className={styles.sectionTitle}>⏱️ Session Duration</h2>
                      <p className={styles.mutedText} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                        How many hours do you want to play? ({fmt12(selectedSlot)} → {fmt12(endTime)})
                      </p>
                      <div className={styles.hourSelector}>
                        {Array.from({ length: maxHoursForSlot(selectedSlot) }, (_, i) => i + 1).map(h => {
                          // Check if adding h hours would overlap a booked slot
                          const startH = parseInt(selectedSlot.split(':')[0], 10);
                          const wouldOverlap = Array.from({ length: h }, (_, i) => `${String(startH + i).padStart(2, '0')}:00`)
                            .some(s => s !== selectedSlot && bookedSlots.has(s));
                          return (
                            <button
                              key={h}
                              disabled={wouldOverlap}
                              className={`${styles.hourBtn} ${durationHours === h ? styles.hourBtnActive : ''} ${wouldOverlap ? styles.hourBtnDisabled : ''}`}
                              onClick={() => !wouldOverlap && setDurationHours(h)}
                            >
                              <span className={styles.hourNum}>{h}</span>
                              <span className={styles.hourLabel}>{h === 1 ? 'Hour' : 'Hours'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className={styles.section}>
                      <h2 className={styles.sectionTitle}>📅 Consecutive Days</h2>
                      <p className={styles.mutedText} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                        Book this same slot for multiple consecutive days?
                      </p>
                      <div className={styles.durationSelector}>
                        {[{ days: 1, label: 'Just once' }, { days: 7, label: 'Whole Week' }, { days: 14, label: 'Two Weeks' }].map(opt => (
                          <label
                            key={opt.days}
                            className={`${styles.durationLabel} ${durationDays === opt.days ? styles.durationActive : ''}`}
                          >
                            <input
                              type="radio"
                              name="durationDays"
                              value={opt.days}
                              checked={durationDays === opt.days}
                              onChange={() => setDurationDays(opt.days)}
                              style={{ display: 'none' }}
                            />
                            <div className={styles.durationContent}>
                              <strong>{opt.days} {opt.days === 1 ? 'Day' : 'Days'}</strong>
                              <span>{opt.label}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </>
            )}

            {/* STEP 2 — Your Details */}
            {step === 2 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>👤 Your Details</h2>
                <div className={styles.detailsGrid}>
                  <label className={styles.field}>
                    <span>Full Name</span>
                    <input className={styles.input} placeholder="e.g. Prashant" value={name} onChange={e => setName(e.target.value)} />
                  </label>
                  <label className={styles.field}>
                    <span>Phone Number</span>
                    <input className={styles.input} placeholder="98XXXXXXXX" value={contact} onChange={e => setContact(e.target.value)} />
                  </label>
                </div>
              </section>
            )}

            {/* STEP 3 — Review */}
            {step === 3 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>✅ Review Booking</h2>
                <div className={styles.reviewCard}>
                  {selectedCourt?.imageUrl ? (
                    <img
                      src={selectedCourt.imageUrl.startsWith('http') ? selectedCourt.imageUrl : `${API_BASE}${selectedCourt.imageUrl}`}
                      alt={selectedCourt.name}
                      className={styles.reviewImage}
                    />
                  ) : (
                    <div className={styles.reviewTurf} />
                  )}
                  <div className={styles.reviewRows}>
                    <div className={styles.reviewRow}><span>Court</span><strong>{selectedCourt?.name}</strong></div>
                    <div className={styles.reviewRow}>
                      <span>Date(s)</span>
                      <strong>
                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {durationDays > 1 && ` (x${durationDays} Days)`}
                      </strong>
                    </div>
                    <div className={styles.reviewRow}><span>Time</span><strong>{fmt12(selectedSlot)} – {fmt12(endTime)} ({durationHours} {durationHours === 1 ? 'hr' : 'hrs'})</strong></div>
                    <div className={styles.reviewRow}><span>Name</span><strong>{name}</strong></div>
                    <div className={styles.reviewRow}><span>Contact</span><strong>{contact}</strong></div>
                  </div>
                </div>

                <hr className={styles.summaryDivider} />
                <div className={styles.summaryTotals}>
                  <div className={styles.summaryRow}>
                    <span>Base Hourly Rate</span>
                    <span>Rs. {pricing.baseHourly}</span>
                  </div>

                  {pricing.breakdown.map((item, idx) => (
                    <div key={idx} className={styles.summaryRow} style={{ color: '#f97316' }}>
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}

                  <div className={styles.summaryRow}>
                    <span>Session</span>
                    <span>{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</span>
                  </div>
                  {durationDays > 1 && (
                    <div className={styles.summaryRow}>
                      <span>Days</span>
                      <span>{durationDays} Days</span>
                    </div>
                  )}
                  <div className={`${styles.summaryRow} ${styles.summaryGrandTotal}`}>
                    <span>Total Amount</span>
                    <span>Rs. {pricing.total}</span>
                  </div>
                </div>
                {message && (
                  <p className={`${styles.feedback} ${messageType === 'error' ? styles.feedbackError : styles.feedbackSuccess}`}>
                    {message}
                  </p>
                )}
              </section>
            )}

            {/* Navigation Buttons */}
            <div className={styles.navBtns}>
              {step > 0 && (
                <button className={styles.backBtn} onClick={() => setStep(s => s - 1)}>
                  ← Back
                </button>
              )}
              <button
                className={styles.nextBtn}
                disabled={!canNext() || submitting}
                onClick={handleNext}
              >
                {step === 3 ? (submitting ? 'Processing…' : 'Confirm & Pay →') : 'Continue →'}
              </button>
            </div>
          </div>

          {/* ── Right: Booking Summary ── */}
          <aside className={styles.summary}>
            <h3 className={styles.summaryTitle}>Booking Summary</h3>
            <div className={styles.summaryTurf} style={selectedCourt?.imageUrl ? { background: 'none' } : {}}>
              {selectedCourt?.imageUrl && (
                <img
                  src={selectedCourt.imageUrl.startsWith('http') ? selectedCourt.imageUrl : `${API_BASE}${selectedCourt.imageUrl}`}
                  alt={selectedCourt.name}
                  className={styles.summaryImage}
                />
              )}
              {selectedCourt && <span className={styles.summaryCourtName}>{selectedCourt.name}</span>}
            </div>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>📅 Date</span>
                <strong>{selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>🕐 Time</span>
                <strong>{selectedSlot ? `${fmt12(selectedSlot)} – ${fmt12(endTime)}` : '—'}{durationHours > 1 && selectedSlot ? ` (${durationHours}h)` : ''}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>🏟️ Court</span>
                <strong>{selectedCourt?.type || '—'}</strong>
              </div>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total Price</span>
              <span className={styles.summaryPrice}>NPR {pricing.total}</span>
            </div>
            <button
              className={styles.confirmBtn}
              disabled={!canNext() || submitting || step < 3}
              onClick={handleNext}
            >
              {submitting ? 'Processing…' : 'Confirm Booking →'}
            </button>
            <p className={styles.secureNote}> Secure payment powered by Stripe</p>
          </aside>
        </div>
      </main>

      {/* ── Confirmation Modal ── */}
      {showConfirm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.modalEyebrow}> Final Confirmation</p>
            <h3 className={styles.modalTitle}>Lock in your slot?</h3>
            <p className={styles.modalSub}>
              {selectedCourt?.name} · {fmt12(selectedSlot)}–{fmt12(endTime)} · {selectedDate}
              {durationDays > 1 && ` (x${durationDays} Days)`}
            </p>
            <p className={styles.modalPrice}>NPR {pricing.total}</p>
            <div className={styles.modalActions}>
              <button className={styles.modalBack} onClick={() => setShowConfirm(false)} disabled={submitting}>Go back</button>
              <button className={styles.modalConfirm} onClick={submitReservation} disabled={submitting}>
                {submitting ? 'Processing…' : 'Yes, Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>⚽ Himalayan Futsal</div>
        <div className={styles.footerLinks}>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Support</a>
        </div>
        <div className={styles.footerDots}>
          <span style={{ background: '#f87171' }} />
          <span style={{ background: '#60a5fa' }} />
          <span style={{ background: '#f97316' }} />
        </div>
      </footer>
    </div>
  );
}
