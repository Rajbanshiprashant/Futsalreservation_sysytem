import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!name || !date || !time || !contact) {
      setMessageType('error');
      setMessage('All fields are required');
      return;
    }

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
    }
  };

  return (
    <div className="reservations-container">
      <h3>Make a Reservation</h3>
      <form className="reservation-form" onSubmit={handleSubmit}>
        <label>
          Your Name:
          <input value={name} onChange={(e) => setName(e.target.value)} />

        </label>
        <label>
          Date:
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Time Slot:
          <select value={time} onChange={(e) => setTime(e.target.value)}>
            <option value="">Select a time</option>
            <option value="6-7am">6-7am</option>
            <option value="7-8am">7-8am</option>
            <option value="8-9am">8-9am</option>
            <option value="5-6pm">5-6pm</option>
            <option value="6-7pm">6-7pm</option>
          </select>
        </label>
        <label>
          Contact:
          <input value={contact} onChange={(e) => setContact(e.target.value)} />
        </label>
        <button type="submit">Reserve</button>
      </form>
      {message && <p className={messageType === 'success' ? 'message-success' : 'message-error'}>{message}</p>}

      <div style={{ marginTop: 20 }}>
        <h4>Your reservations</h4>
        {loading && <p className="small">Loading reservations...</p>}
        {!loading && reservations.length === 0 && <p className="small">No reservations yet.</p>}
        {!loading && reservations.length > 0 && (
          <ul className="reservation-list">
            {reservations.map((reservation) => (
              <li key={reservation._id}>
                <strong>{reservation.name}</strong> — {reservation.date} at {reservation.time} ({reservation.contact})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
