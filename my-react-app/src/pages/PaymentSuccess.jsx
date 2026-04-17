import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('Verifying your payment…');
  const [txnId, setTxnId] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setStatus('failed');
      setMessage('No payment session found. Please contact support.');
      return;
    }

    // Verify with backend
    (async () => {
      try {
        const data = await apiClient.post('/api/payment/verify', {
          token,
          body: { sessionId },
        });

        if (data.success) {
          setStatus('success');
          setTxnId(data.transactionId || '');
          setMessage(data.message || 'Payment verified! Your court is confirmed.');
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment verification failed.');
        }
      } catch (err) {
        setStatus('failed');
        setMessage(err.message || 'Payment verification error. Please contact support.');
      }
    })();
  }, [searchParams, token]);

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        {status === 'verifying' && (
          <>
            <div className={styles.spinner} />
            <h2 className={styles.title}>Verifying Payment…</h2>
            <p className={styles.sub}>Please wait while we confirm your booking.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.iconSuccess}>✓</div>
            <h2 className={styles.title}>Booking Confirmed! </h2>
            <p className={styles.sub}>{message}</p>
            {txnId && (
              <div className={styles.txnBox}>
                <span className={styles.txnLabel}>Transaction ID</span>
                <span className={styles.txnValue}>{txnId}</span>
              </div>
            )}
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => navigate('/dashboard')}>
                View My Bookings
              </button>
              <button className={styles.secondaryBtn} onClick={() => navigate('/reservations')}>
                Book Another Court
              </button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className={styles.iconFailed}>✕</div>
            <h2 className={styles.title}>Payment Failed</h2>
            <p className={styles.sub}>{message}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => navigate('/reservations')}>
                Try Again
              </button>
              <button className={styles.secondaryBtn} onClick={() => navigate('/')}>
                Go to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
