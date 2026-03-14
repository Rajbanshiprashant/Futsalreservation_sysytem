import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Payment.module.css';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext.jsx';

const DEFAULT_RATE = 1200;

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const reservation = location.state?.reservation;
  const amount = location.state?.amount ?? DEFAULT_RATE;

  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [message, setMessage] = useState('');
  const [method, setMethod] = useState('khalti');

  useEffect(() => {
    if (!reservation) {
      setMessage('No reservation details found. Redirecting…');
      const t = setTimeout(() => navigate('/reservations'), 2500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [reservation, navigate]);

  /* ── Khalti Payment ── */
  const handleKhaltiPay = async () => {
    if (!reservation?._id) {
      setStatus('error');
      setMessage('Reservation ID missing. Please try booking again.');
      return;
    }
    setStatus('processing');
    setMessage('');
    try {
      const data = await apiClient.post('/api/payment/initiate', {
        token,
        body: { reservationId: reservation._id },
      });
      // Redirect browser to Khalti's payment page
      window.location.href = data.payment_url;
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to initiate Khalti payment. Please try again.');
    }
  };

  const handlePayment = () => {
    if (method === 'khalti') {
      handleKhaltiPay();
    } else {
      // Placeholder for other methods
      setStatus('error');
      setMessage(`${method} payment integration coming soon.`);
    }
  };

  const summaryDetails = useMemo(() => {
    if (!reservation) return [];
    return [
      { label: 'Player', value: reservation.name },
      { label: 'Court', value: reservation.court?.name || '—' },
      { label: 'Date', value: reservation.date ? new Date(reservation.date).toLocaleDateString('en-GB') : '—' },
      { label: 'Time', value: reservation.startTime && reservation.endTime ? `${reservation.startTime} – ${reservation.endTime}` : '—' },
      { label: 'Contact', value: reservation.contact },
      { label: 'Amount due', value: `NPR ${amount}` },
    ];
  }, [reservation, amount]);

  const paymentOptions = [
    { value: 'khalti', label: 'Khalti', hint: 'Rewards eligible · Recommended' },
  ];

  return (
    <div className={styles.paymentShell}>
      <div className={styles.paymentCard}>
        <header className={styles.paymentHeader}>
          <button className={styles.secondaryBtn} type="button" onClick={() => navigate('/reservations')}>
            ← Back
          </button>
          <div>
            <p className={styles.eyebrow}> Secure checkout</p>
            <h2>Complete your payment</h2>
            <p className={styles.subtext}>Review your reservation and pay with Khalti.</p>
          </div>
        </header>

        {reservation ? (
          <>
            <section className={styles.summarySection}>
              <div className={styles.summaryHeader}>
                <div>
                  <p className={styles.eyebrow}>Reservation</p>
                  <h3>Summary</h3>
                </div>
                <span className={styles.badge}>
                  {reservation.date ? new Date(reservation.date).toLocaleDateString('en-GB') : '—'}
                </span>
              </div>
              <div className={styles.summaryGrid}>
                {summaryDetails.map((item) => (
                  <div key={item.label} className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>{item.label}</p>
                    <p className={styles.summaryValue}>{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.methodSection}>
              <div className={styles.methodHeader}>
                <div>
                  <p className={styles.eyebrow}>Payment options</p>
                  <h3>Select method</h3>
                </div>
                <p className={styles.subtext}>Supported wallets in Nepal</p>
              </div>
              <div className={styles.methodGrid}>
                {paymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`${styles.methodCard} ${method === option.value ? styles.methodActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={option.value}
                      checked={method === option.value}
                      onChange={(e) => setMethod(e.target.value)}
                    />
                    <div>
                      <p className={styles.methodLabel}>{option.label}</p>
                      <p className={styles.methodHint}>{option.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <div className={styles.ctaRow}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handlePayment}
                disabled={status === 'processing'}
              >
                {status === 'processing'
                  ? '⏳ Redirecting to Khalti…'
                  : `Pay NPR ${amount} with ${method}`}
              </button>
              <p className={styles.helpText}>You will receive a confirmation SMS after successful payment.</p>
            </div>

            {message && (
              <p className={`${styles.statusMessage} ${status === 'error' ? styles.error : styles.success}`}>
                {message}
              </p>
            )}
          </>
        ) : (
          <p className={`${styles.statusMessage} ${styles.error}`}>
            {message || 'Missing reservation details.'}
          </p>
        )}
      </div>
    </div>
  );
}
