import React, { useState } from 'react';
import '../App.css';

export default function Reservations() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    if (!name || !date || !time || !contact) {
      setMessageType('error');
      setMessage('All fields are required');
      return;
    }

    const token = localStorage.getItem('token');

    fetch('http://localhost:3000/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name, date, time, contact }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save reservation');
        setMessageType('success');
        setMessage('Reservation saved');
        setName('');
        setDate('');
        setTime('');
        setContact('');
      })
      .catch((err) => {
        setMessageType('error');
        setMessage(err.message);
      });
  };

  return (
    <div className="reservations-container">
      <h3>Make a Reservation</h3>
      <form className="reservation-form" onSubmit={handleSubmit}>
        <label>
          Your Name:
          <input value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label>
          Date:
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <label>
          Time Slot:
          <select value={time} onChange={e => setTime(e.target.value)}>
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
          <input value={contact} onChange={e => setContact(e.target.value)} />
        </label>
        <button type="submit">Reserve</button>
      </form>
      {message && <p className={messageType === 'success' ? 'message-success' : 'message-error'}>{message}</p>}
    </div>
  );
}
