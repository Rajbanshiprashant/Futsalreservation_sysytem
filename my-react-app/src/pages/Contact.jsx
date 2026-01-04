import SiteHeader from '../components/layout/SiteHeader.jsx';
import styles from './Contact.module.css';

export default function Contact() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className={styles.contactShell}>
      <SiteHeader className={styles.pageHeader} />
      <section className={styles.heroSection}>
        <p className={styles.heroPill}>Let's talk futsal</p>
        <h1 className={styles.heroTitle}>We help teams find their perfect playing window.</h1>
        <p className={styles.heroSubtext}>
          Our reservation concierge is on standby to help you secure slots, coordinate tournaments, or
          answer product questions. Reach out through the form, WhatsApp, or pay us a visit at the arena.
        </p>
        <div className={styles.heroStats}>
          <article>
            <span>Avg. response time</span>
            <strong>15 minutes</strong>
          </article>
          <article>
            <span>Support hours</span>
            <strong>6:00 AM – 11:00 PM</strong>
          </article>
          <article>
            <span>Community teams served</span>
            <strong>250+</strong>
          </article>
        </div>
      </section>

      <section className={styles.contactGrid}>
        <div className={styles.infoColumn}>
          <div className={styles.infoCard}>
            <span className={styles.cardLabel}>Visit us</span>
            <h3>Himalayan Futsal Arena</h3>
            <p>Mid-Baneshwor, Kathmandu 44600</p>
            <p>Open daily including public holidays.</p>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.cardLabel}>Call or chat</span>
            <h3>+977 984-1234567</h3>
            <p className={styles.muted}>WhatsApp / Viber available</p>
            <p className={styles.muted}>support@futsalreservation.com</p>
          </div>
          <div className={`${styles.infoCard} ${styles.highlightCard}`}>
            <span className={styles.cardLabel}>Need a fast booking?</span>
            <h3>Express lane</h3>
            <p>
              Share your preferred day, slot, and team size. We pre-hold an available court and send a payment
              link instantly.
            </p>
          </div>
        </div>

        <form className={styles.contactForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label>
              Full name
              <input type="text" name="name" placeholder="Sandesh Rai" required />
            </label>
            <label>
              Team name
              <input type="text" name="team" placeholder="Skyline FC" />
            </label>
          </div>
          <div className={styles.formRow}>
            <label>
              Email
              <input type="email" name="email" placeholder="you@email.com" required />
            </label>
            <label>
              Phone / WhatsApp
              <input type="tel" name="phone" placeholder="980-0000000" required />
            </label>
          </div>
          <label>
            Preferred play date
            <input type="date" name="date" />
          </label>
          <label>
            Message
            <textarea name="message" rows="4" placeholder="Tell us how we can help your squad..." required />
          </label>
          <button type="submit">Send message</button>
          <p className={styles.formHint}>We reply through email and WhatsApp with available slots.</p>
        </form>
      </section>

      <section className={styles.visitSection}>
        <div>
          <h3>Prefer dropping by?</h3>
          <p>
            Our lounge overlooks the futsal turf so you can review slot schedules while catching live play.
            Guided tours for team managers are available on request.
          </p>
        </div>
        <div className={styles.visitBadge}>
          <span>Parking</span>
          <strong>Free for 2 hours</strong>
        </div>
        <div className={styles.visitBadge}>
          <span>Café</span>
          <strong>Brewed coffee & recovery bowls</strong>
        </div>
      </section>
    </div>
  );
}
