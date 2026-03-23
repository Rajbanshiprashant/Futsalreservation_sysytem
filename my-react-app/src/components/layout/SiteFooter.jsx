import React from 'react';
import { FiFacebook, FiInstagram, FiTwitter, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import styles from './SiteFooter.module.css';

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerGrid}>
          {/* Brand & About */}
          <div className={styles.footerSection}>
            <h3 className={styles.brandName}>Himalayan Futsal</h3>
            <p className={styles.brandDesc}>
              The fastest and most reliable way to book futsal courts online. We bring games to life, one pitch at a time.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" aria-label="Facebook" className={styles.socialIcon}><FiFacebook /></a>
              <a href="#" aria-label="Instagram" className={styles.socialIcon}><FiInstagram /></a>
              <a href="#" aria-label="Twitter" className={styles.socialIcon}><FiTwitter /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Quick Links</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#">Home</a></li>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Courts & Pricing</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Legal</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Cancellation Policy</a></li>
              <li><a href="#">Cookie Guidelines</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Contact Us</h4>
            <ul className={styles.contactList}>
              <li>
                <FiMapPin className={styles.contactIcon} />
                <span>Kathmandu, Nepal</span>
              </li>
              <li>
                <FiPhone className={styles.contactIcon} />
                <span>+977 9826953695</span>
              </li>
              <li>
                <FiMail className={styles.contactIcon} />
                <span>hello@himalayanfutsal.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; {currentYear} Himalayan Futsal Reservation System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
