import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiLogOut, FiUserPlus, FiLogIn } from 'react-icons/fi';
import SiteHeader from '../components/layout/SiteHeader.jsx';
import SiteFooter from '../components/layout/SiteFooter.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
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
            {token ? (
              <>
                <h1 className={styles.heroTitle}>
                  Welcome back, <span>{user?.username || 'Player'}</span>
                </h1>
                <p className={styles.heroSubtext}>
                  You're already logged in. Ready for another match? Head over to the Booking dashboard to secure your next court instantly.
                </p>
                <div className={styles.heroActions}>
                  <button className={styles.primaryCta} onClick={() => navigate('/reservations')}>
                    <FiCalendar className={styles.btnIcon} /> Book a Court
                  </button>
                  <button className={styles.ghostBtn} onClick={logout}>
                    <FiLogOut className={styles.btnIcon} /> Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className={styles.heroTitle}>
                  Welcome to best <span>Futsal Reservation System</span>
                </h1>
                <p className={styles.heroSubtext}>
                  Discover the fastest way to reserve futsal courts anytime, anywhere. Check real-time availability, secure your slot instantly.
                </p>
                <div className={styles.heroActions}>
                  <button className={styles.primaryCta} onClick={() => goToAuth('register')}>
                    <FiUserPlus className={styles.btnIcon} /> Join Now
                  </button>
                  <button className={styles.ghostBtn} onClick={() => goToAuth('login')}>
                    <FiLogIn className={styles.btnIcon} /> Already a member?
                  </button>
                </div>
              </>
            )}
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
      
      <SiteFooter />
    </div>
  );
}
