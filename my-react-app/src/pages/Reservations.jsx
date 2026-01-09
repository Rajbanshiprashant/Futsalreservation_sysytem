import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Reservations.module.css';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext.jsx';

const HOURLY_RATE = 1200;

export default function Reservations() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timeSlots = ['6-7am', '7-8am', '8-9am', '9-10am', '10-11pm','11-12am', '12-1pm', '1-2pm', '2-3pm', '3-4pm', '4-5pm', '5-6pm', '6-7pm', '7-8pm', '8-9pm', '9-10pm'];

  const resetForm = () => {
    setName('');
    setDate('');
    setTime('');
    setContact('');
  };

  const fetchReservations = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiClient.get('/api/reservations', { token });
      setReservations(data);
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    if (!name || !date || !time || !contact) {
      setMessageType('error');
      setMessage('All fields are required');
      return;
    }
    setShowConfirm(true);
  };

  const submitReservation = async () => {
    setSubmitting(true);
    try {
      const data = await apiClient.post('/api/reservations', {
        token,
        body: { name, date, time, contact },
      });
      setMessageType('success');
      setMessage('Reservation saved. Redirecting to payment...');
      resetForm();
      await fetchReservations();

      const reservationPayload = data?.reservation ?? { name, date, time, contact };
      navigate('/payment', {
        state: {
          reservation: reservationPayload,
          amount: HOURLY_RATE,
        },
      });
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReservation = async () => {
    setShowConfirm(false);
    await submitReservation();
  };

  return (
    <div className={styles.reservationsShell}>
      <div className={styles.formColumn}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.eyebrow}>Reservation Form</p>
            <h3>Make a Reservation</h3>
            <p className={styles.subtext}>Secure your preferred hour at Himalayan Futsal.</p>
          </div>
          <form className={styles.formGrid} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Your Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Time Slot</span>
              <select value={time} onChange={(e) => setTime(e.target.value)}>
                <option value="">Select a time</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Contact</span>
              <input value={contact} onChange={(e) => setContact(e.target.value)} />
            </label>
            <button className={styles.primaryBtn} type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Reserve Slot'}
            </button>
          </form>
          {message && (
            <p className={`${styles.feedback} ${messageType === 'success' ? styles.success : styles.error}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      <div className={styles.infoColumn}>
        <div className={styles.infoCard}>
          <div>
            <p className={styles.eyebrow}>Rate</p>
            <p className={styles.infoValue}>NPR {HOURLY_RATE}</p>
          </div>
          <div>
            <p className={styles.eyebrow}>Capacity</p>
            <p className={styles.infoValue}>Up to 10 players</p>
          </div>
          <div>
            <p className={styles.eyebrow}>Surface</p>
            <p className={styles.infoValue}>5-a-side turf</p>
          </div>
        </div>

        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <div>
              <p className={styles.eyebrow}>Overview</p>
              <h4>Your reservations</h4>
            </div>
            <span className={styles.badge}>{reservations.length}</span>
          </div>
          {loading && <p className={styles.smallText}>Loading reservations...</p>}
          {!loading && reservations.length === 0 && <p className={styles.smallText}>No reservations yet.</p>}
          {!loading && reservations.length > 0 && (
            <ul className={styles.reservationList}>
              {reservations.map((reservation) => (
                <li key={reservation._id} className={styles.reservationItem}>
                  <div>
                    <p className={styles.reservationName}>{reservation.name}</p>
                    <p className={styles.reservationMeta}>{reservation.contact}</p>
                  </div>
                  <div className={styles.reservationTime}>
                    <span>{reservation.date}</span>
                    <span>{reservation.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <p className={styles.eyebrow}>Confirmation</p>
            <h4>Are you sure you want to reserve this slot?</h4>
            <p className={styles.subtext}>
              Proceeding will redirect you to payment. You can still review your reservation details.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                No, go back
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={confirmReservation}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Yes, proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
