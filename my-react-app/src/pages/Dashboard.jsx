import React, { useState } from 'react';
import Reservations from './Reservations';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [view, setView] = useState('hero'); // 'hero' | 'reservations'
  const { user, logout, loading } = useAuth();

  const futsalDetails = {
    name: 'ABC Futsal',
    location: 'Kathmandu',
    availability: 'Available for booking',
    open: 'Open all days',
    price: 'Price: 1200 per hr',
    type: '5 side',
    capacity: 'Max 10 players',
  };

  return (
    <div className={styles.dashboardShell}>
      <header className={styles.dashboardHeader}>
        <div>
          <p className={styles.dashboardEyebrow}>Futsal Reservation System</p>
          <h2 className={styles.dashboardTitle}>Welcome{user?.username ? `, ${user.username}` : ''}!</h2>
          {loading && <p className={styles.dashboardEyebrow}>Loading profile...</p>}
        </div>
        <button className={styles.secondaryBtn} onClick={logout}>Logout</button>
      </header>

      {view === 'hero' && (
        <section className={styles.heroWrapper}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardMedia} aria-label="Futsal field" />
            <div className={styles.heroCardContent}>
              <h3>{futsalDetails.name}</h3>
              <p className={styles.heroLocation}>{futsalDetails.location}</p>
              <p className={styles.heroAvailability}>{futsalDetails.availability}</p>
              <ul className={styles.heroMeta}>
                <li>{futsalDetails.open}</li>
                <li>{futsalDetails.price}</li>
                <li>{futsalDetails.type}</li>
                <li>{futsalDetails.capacity}</li>
              </ul>
              <button className={styles.primaryBtn} onClick={() => setView('reservations')}>
                Book Now
              </button>
            </div>
          </div>
        </section>
      )}

      {view === 'reservations' && (
        <section className={styles.reservationPanel}>
          <div className={styles.reservationPanelCard}>
            <div className={styles.reservationPanelHeader}>
              <div>
                <p className={styles.dashboardEyebrow}>Reserve your slot</p>
                <h3>{futsalDetails.name}</h3>
              </div>
              <button className={styles.secondaryBtn} onClick={() => setView('hero')}>
                Back to details
              </button>
            </div>
            <Reservations />
          </div>
        </section>
      )}
    </div>
  );
}
