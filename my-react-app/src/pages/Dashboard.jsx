import React, { useState } from 'react';
import Reservations from './Reservations';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [view, setView] = useState('hero'); // 'hero' | 'reservations'
  const { user, logout, loading } = useAuth();

  const futsalDetails = {
    name: 'Himalayan Futsal',
    location: 'Kathmandu',
    availability: 'Available for booking',
    open: 'Open all days',
    price: 'Price: 1200 per hr',
    type: '5 side',
    capacity: 'Max 10 players',
  };

  const detailFrames = [
    { label: 'Location', value: futsalDetails.location },
    { label: 'Availability', value: futsalDetails.availability },
    { label: 'Operating Hours', value: futsalDetails.open },
    { label: 'Hourly Rate', value: futsalDetails.price },
    { label: 'Court Type', value: futsalDetails.type },
    { label: 'Capacity', value: futsalDetails.capacity },
  ];

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
              <div className={styles.heroHeader}>
                <div>
                  <p className={styles.dashboardEyebrow}>Featured Court</p>
                  <h3>{futsalDetails.name}</h3>
                </div>
                <span className={styles.heroBadge}>{futsalDetails.availability}</span>
              </div>
              <div className={styles.detailGrid}>
                {detailFrames.map((item) => (
                  <div key={item.label} className={styles.detailCard}>
                    <p className={styles.detailLabel}>{item.label}</p>
                    <p className={styles.detailValue}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className={styles.heroActions}>
                <button className={styles.primaryBtn} onClick={() => setView('reservations')}>
                  Book Now
                </button>
              </div>
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
