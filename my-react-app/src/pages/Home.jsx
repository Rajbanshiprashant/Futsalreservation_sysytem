import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/layout/SiteHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const goToAuth = (mode = 'login') => {
    navigate(`/auth?mode=${mode}`);
  };

  return (
    <div className={styles.homeShell}>
      <section className={styles.heroSection}>
        <SiteHeader className={styles.heroNav} />
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.heroPill}> Himalayan Futsal</p>
            <h1 className={styles.heroTitle}>
              Welcome to best <span>Futsal Reservation System</span>
            </h1>
            <p className={styles.heroSubtext}>
              Discover the fastest way to reserve futsal courts anytime, anywhere. Check real-time availability, secure your slot instantly, and keep your team organized—all in one simple, powerful platform built for players and futsal owners.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.primaryCta} onClick={() => goToAuth('register')}>Join Now</button>
              <button className={styles.ghostBtn} onClick={() => goToAuth('login')}>Already a member?</button>
            </div>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroVisualBrowser}>
              <div className={styles.browserDots}>
                <span className={styles.browserDot} />
                <span className={styles.browserDot} />
                <span className={styles.browserDot} />
              </div>
              <div className={styles.heroVisualPlayground}>
                <div className={styles.heroPlayer} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
