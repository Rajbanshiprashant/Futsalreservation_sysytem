import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';

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

  return (
    <div className="payment-shell">
      <div className="payment-card">
        <header className="payment-card-header">
          <button className="secondary-btn" type="button" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
          <h2>Complete your payment</h2>
          <p className="small">Secure your slot by paying the reservation fee.</p>
        </header>

        {reservation ? (
          <>
            <section className="payment-summary">
              <h3>Reservation summary</h3>
              <div className="payment-summary-grid">
                <div>
                  <span>Player name</span>
                  <strong>{reservation.name}</strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>{reservation.date}</strong>
                </div>
                <div>
                  <span>Time slot</span>
                  <strong>{reservation.time}</strong>
                </div>
                <div>
                  <span>Contact</span>
                  <strong>{reservation.contact}</strong>
                </div>
                <div>
                  <span>Amount due</span>
                  <strong>Rs {amount}</strong>
                </div>
              </div>
            </section>

            <section className="payment-methods">
              <h3>Select payment method</h3>
              <div className="payment-method-options">
                {['esewa', 'khalti', 'fonepay'].map((value) => (
                  <label key={value} className={`payment-method ${method === value ? 'payment-method-active' : ''}`}>
                    <input
                      type="radio"
                      name="payment-method"
                      value={value}
                      checked={method === value}
                      onChange={(e) => setMethod(e.target.value)}
                    />
                    <span>{value === 'esewa' ? 'eSewa' : value === 'khalti' ? 'Khalti' : 'FonePay'}</span>
                  </label>
                ))}
              </div>
            </section>

            <button
              type="button"
              className="primary-btn payment-btn"
              onClick={handlePayment}
              disabled={status === 'processing'}
            >
              {status === 'processing' ? 'Processing...' : `Pay Rs ${amount} with ${method}`}
            </button>
            {message && (
              <p className={status === 'success' ? 'message-success' : 'message-error'}>{message}</p>
            )}
          </>
        ) : (
          <p className="message-error">{message || 'Missing reservation details.'}</p>
        )}
      </div>
    </div>
  );
}
