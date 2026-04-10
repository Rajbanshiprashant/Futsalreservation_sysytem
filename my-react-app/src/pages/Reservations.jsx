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
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [durationDays, setDurationDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Data ── */
  const [courts, setCourts] = useState([]);
  const [existingReservations, setExistingReservations] = useState([]);
  const [allReservations, setAllReservations] = useState([]); // for booked-slot detection

  const days = useMemo(() => getNext14Days(), []);

  const selectedCourt = courts.find(c => c._id === courtId);

  /* ── Fetch ── */
  useEffect(() => {
    apiClient.get('/api/courts').then(d => setCourts(d.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!token) return;
    apiClient.get('/api/reservations', { token })
      .then(d => setExistingReservations(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, [token]);

  /* Also fetch admin reservations to mark booked slots (public courts already booked) */
  useEffect(() => {
    if (!courtId || !selectedDate) return;
    // We'll just use the current user's existing reservations + server conflict check
    // Show slots that belong to the selected court + date as booked
    setAllReservations(existingReservations.filter(
      r => r.court?._id === courtId || r.court === courtId
    ));
  }, [courtId, selectedDate, existingReservations]);

  /* ── Booked slots ── */
  const bookedSlots = useMemo(() => {
    const booked = new Set();
    allReservations.forEach(r => {
      const rDate = new Date(r.date).toISOString().slice(0, 10);
      if (rDate === selectedDate) {
        booked.add(r.startTime?.slice(0, 5));
      }
    });
    return booked;
  }, [allReservations, selectedDate]);

  /* ── Dynamic Pricing Algorithm (Rule-Based Engine V2) ── */
  const calculateDynamicPrice = () => {
    let basePrice = selectedCourt?.hourlyRate || 1500;
    let total = 0;
    let breakdown = [];
    let weekendCount = 0;
    let peakCount = 0;

    if (!selectedDate || !selectedSlot) return { total: basePrice, breakdown, baseHourly: basePrice };

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

        // Rule 2: Peak Hour Surcharge
        const hour = parseInt(selectedSlot.split(':')[0], 10);
        if (hour >= 17 && hour <= 21) {
            dailyMultiplier *= 1.5;
            peakCount++;
        }

        total += Math.round(basePrice * dailyMultiplier);
    }
// peakCount and weekendCount are used to generate a clear breakdown of the surcharges applied based on the user's selections. This way, users can see exactly how the final price is derived from the base price and the specific rules that apply to their booking.
    if (weekendCount > 0) breakdown.push({ label: `Weekend Surcharge (x${weekendCount} days)`, value: 'x1.2' });
    if (peakCount > 0) breakdown.push({ label: `Peak Hour Surcharge (x${peakCount} days)`, value: 'x1.5' });

    return { 
      baseHourly: basePrice, 
      total: total,
      breakdown 
    };
  };

  const pricing = useMemo(() => calculateDynamicPrice(), [selectedCourt, selectedDate, selectedSlot, durationDays]);

  /* ── Submit — create reservation then redirect straight to Khalti ── */
  const submitReservation = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const endTime = TIME_SLOTS[TIME_SLOTS.indexOf(selectedSlot) + 1] || '22:00';
      const totalPrice = pricing.total; 

      // 1. Create the reservation
      const data = await apiClient.post('/api/reservations', {
        token,
        body: { name, date: selectedDate, startTime: selectedSlot, endTime, contact, courtId, totalPrice, days: durationDays },
      });

      const reservationIds = data?.allReservations?.map(r => r._id);
      if (!reservationIds || reservationIds.length === 0) throw new Error('Reservation created but ID missing.');

      // 2. Initiate Khalti payment
      setMessage('Redirecting to Khalti payment…');
      const payData = await apiClient.post('/api/payment/initiate', {
        token,
        body: { reservationIds },
      });

      // 3. Redirect browser to Khalti's hosted payment page
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
    if (step === 1) return Boolean(selectedDate && selectedSlot && durationDays >= 1);
    if (step === 2) return Boolean(name.trim()) && contact.trim().length >= 7;
    return true;
  };

  const endTime = selectedSlot
    ? TIME_SLOTS[TIME_SLOTS.indexOf(selectedSlot) + 1] || '22:00'
    : '';

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
                    🕐 Available Slots
                    <span className={styles.slotLegend}>
                      <span className={styles.legendDot} style={{ background: '#f97316' }} /> Selected
                      <span className={styles.legendDot} style={{ background: '#444' }} /> Available
                      <span className={styles.legendDot} style={{ background: '#2a2a2a', border: '1px solid #444', textDecoration: 'line-through' }} /> Booked
                    </span>
                  </h2>
                  <div className={styles.slotGrid}>
                    {TIME_SLOTS.map((slot, idx) => {
                      const isBooked = bookedSlots.has(slot);
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          disabled={isBooked}
                          className={`${styles.slotBtn} ${isBooked ? styles.slotBooked : ''} ${isSelected ? styles.slotSelected : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {isBooked ? <s>{fmt12(slot)}</s> : fmt12(slot)}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {selectedSlot && (
                  <section className={styles.section} style={{ marginTop: '2rem' }}>
                    <h2 className={styles.sectionTitle}>📅 Consecutive Days</h2>
                    <p className={styles.mutedText} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                      Do you want to book this exact time slot for multiple consecutive days?
                    </p>
                    <div className={styles.durationSelector}>
                      {[{days: 1, label: 'Just once'}, {days: 7, label: 'Whole Week'}, {days: 14, label: 'Two Weeks'}].map(opt => (
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
                    <div className={styles.reviewRow}><span>Time</span><strong>{fmt12(selectedSlot)} – {fmt12(endTime)}</strong></div>
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

                  {durationDays > 1 && (
                    <div className={styles.summaryRow}>
                      <span>Duration</span>
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
                <strong>{selectedSlot ? `${fmt12(selectedSlot)} – ${fmt12(endTime)}` : '—'}</strong>
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
            <p className={styles.secureNote}> Secure payment powered by Khalti</p>
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
