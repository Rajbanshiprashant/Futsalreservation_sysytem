import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Payment.module.css';

const DEFAULT_RATE = 1200;

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const reservation = location.state?.reservation;
  const amount = location.state?.amount ?? DEFAULT_RATE;

  const [method, setMethod] = useState('esewa');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!reservation) {
      setMessage('No reservation details found. Redirecting to dashboard...');
      const timer = setTimeout(() => navigate('/dashboard'), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [reservation, navigate]);

  const handlePayment = () => {
    if (!reservation) return;
    setStatus('processing');
    setMessage('');

    setTimeout(() => {
      setStatus('success');
      setMessage('Payment successful! Your futsal court is booked.');
    }, 1200);
  };

  const summaryDetails = useMemo(() => {
    if (!reservation) return [];
    return [
      { label: 'Player', value: reservation.name },
      { label: 'Date', value: reservation.date },
      { label: 'Time slot', value: reservation.time },
      { label: 'Contact', value: reservation.contact },
      { label: 'Amount due', value: `Rs ${amount}` },
    ];
  }, [reservation, amount]);

  const paymentOptions = useMemo(
    () => [
      { value: 'esewa', label: 'eSewa', hint: 'Instant transfer' },
      { value: 'khalti', label: 'Khalti', hint: 'Rewards eligible' },
      { value: 'fonepay', label: 'FonePay', hint: 'Scan & pay' },
    ],
    []
  );

  return (
    <div className={styles.paymentShell}>
      <div className={styles.paymentCard}>
        <header className={styles.paymentHeader}>
          <button className={styles.secondaryBtn} type="button" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
          <div>
            <p className={styles.eyebrow}>Secure checkout</p>
            <h2>Complete your payment</h2>
            <p className={styles.subtext}>Review your reservation and choose a preferred payment method.</p>
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
                <span className={styles.badge}>{reservation.date}</span>
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
                {status === 'processing' ? 'Processing...' : `Pay Rs ${amount} with ${method}`}
              </button>
              <p className={styles.helpText}>You will receive a confirmation SMS after successful payment.</p>
            </div>
            {message && (
              <p className={`${styles.statusMessage} ${status === 'success' ? styles.success : styles.error}`}>
                {message}
              </p>
            )}
          </>
        ) : (
          <p className={`${styles.statusMessage} ${styles.error}`}>{message || 'Missing reservation details.'}</p>
        )}
      </div>
    </div>
  );
}
