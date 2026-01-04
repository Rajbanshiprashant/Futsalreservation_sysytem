
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './SiteHeader.module.css';

const defaultLinks = [
  { label: 'Home', path: '/' },
  { label: 'Contact', path: '/contact' },
];

export default function SiteHeader({ brandText = 'Futsal Reservation System', links = defaultLinks, className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const resolveClassName = (path) => (
    location.pathname === path ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
  );

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <header className={`${styles.headerShell} ${className}`}>
      <div className={styles.brandBadge}>{brandText}</div>
      <nav className={styles.navLinks}>
        {links.map(({ label, path }) => (
          <button
            key={path}
            type="button"
            className={resolveClassName(path)}
            onClick={() => handleNavigate(path)}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}


