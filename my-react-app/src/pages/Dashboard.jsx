import React, { useState } from 'react';
import '../App.css';
import Reservations from './Reservations';

export default function Dashboard({ username, onLogout }) {
  const [view, setView] = useState('home'); // 'home' | 'reservations'

  return (
    <div className="dashboard-container">
      <h2>Welcome{username ? `, ${username}` : ''}!</h2>
      <p>This is the dashboard for the Futsal Reservation System.</p>
      <div className="dashboard-actions">
        <button onClick={() => setView('reservations')}>Make Reservation</button>
        <button onClick={onLogout} style={{ marginLeft: 8 }}>Logout</button>
      </div>

      {view === 'home' && (
        <div style={{ marginTop: 20 }}>
          <p>Use the button above to create a reservation.</p>
        </div>
      )}

      {view === 'reservations' && (
        <div style={{ marginTop: 20 }}>
          <Reservations />
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setView('home')}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
