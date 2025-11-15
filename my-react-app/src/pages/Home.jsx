import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './Home.module.css';

const modes = {
  LOGIN: 'login',
  REGISTER: 'register',
  VERIFY: 'verify',
};

export default function Home() {
  const navigate = useNavigate();
  const { token, login } = useAuth();
  const [mode, setMode] = useState(modes.LOGIN);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [verifyUsername, setVerifyUsername] = useState('');

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const resetMessages = () => {
    setMessage('');
    setMessageType('error');
  };

  const handleModeSwitch = (nextMode) => {
    resetMessages();
    setMode(nextMode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!username || !password) {
      setMessage('Please enter both username and password');
      return;
    }

    try {
      const data = await apiClient.post('/api/auth/login', {
        body: { username, password },
      });
      login(data.token, { username: data.username });
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!username || !email || !password) {
      setMessage('All fields are required');
      return;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      await apiClient.post('/api/auth/register', {
        body: { username, password, email },
      });
      setMessageType('success');
      setMessage('Registration successful. Please verify your account using the OTP sent to your email.');
      setVerifyUsername(username);
      setOtp('');
      setMode(modes.VERIFY);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!verifyUsername || !otp) {
      setMessage('Both username and OTP are required');
      return;
    }

    try {
      await apiClient.post('/api/auth/verify-otp', {
        body: { username: verifyUsername, otp },
      });
      setMessageType('success');
      setMessage('Account verified! You may now log in.');
      setMode(modes.LOGIN);
      setOtp('');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleResendOtp = async () => {
    resetMessages();
    const targetUsername = verifyUsername || username;
    if (!targetUsername) {
      setMessage('Username is required to resend OTP');
      return;
    }

    try {
      await apiClient.post('/api/auth/resend-otp', {
        body: { username: targetUsername },
      });
      setVerifyUsername(targetUsername);
      setMessageType('success');
      setMessage('A new OTP has been sent to your email.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className={styles.homeShell}>
      <section className={styles.heroSection}>
        <header className={styles.heroNav}>
          <div className={styles.brandBadge}>AG Academy</div>
          <nav className={styles.heroNavLinks}>
            <button type="button" className={`${styles.navLink} ${styles.navLinkActive}`}>Home</button>
            <button type="button" className={styles.navLink} onClick={() => handleModeSwitch(modes.REGISTER)}>Programs</button>
            <button type="button" className={styles.navLink} onClick={() => handleModeSwitch(modes.LOGIN)}>Contact</button>
          </nav>
        </header>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.heroPill}>Football Academy</p>
            <h1 className={styles.heroTitle}>
              Welcome to best <span>Football Academy</span>
            </h1>
            <p className={styles.heroSubtext}>
              Some green takes our smart, connected trainings across the city. Nurture next-gen stars with world-class
              coaching, wellness, and match-ready sessions.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.primaryCta} onClick={() => handleModeSwitch(modes.REGISTER)}>Join Now</button>
              <button className={styles.ghostBtn} onClick={() => handleModeSwitch(modes.LOGIN)}>Already a member?</button>
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

      <section className={styles.authSection}>
        <div className={styles.authCard}>
          <h1 className={styles.authCardTitle}>Futsal Reservation System</h1>

          {mode === modes.LOGIN && (
            <>
              <h2>Login</h2>
              <form className={styles.form} onSubmit={handleLogin}>
                <label>
                  Username:
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Password:
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
                <button type="submit">Login</button>
              </form>
              <p className={styles.smallText}>
                Don't have an account?{' '}
                <button className={styles.linkButton} onClick={() => handleModeSwitch(modes.REGISTER)}>
                  Register now
                </button>
              </p>
              <p className={styles.smallText}>
                Need to verify?{' '}
                <button className={styles.linkButton} onClick={() => handleModeSwitch(modes.VERIFY)}>
                  Enter OTP
                </button>
              </p>
            </>
          )}

          {mode === modes.REGISTER && (
            <>
              <h2>Register</h2>
              <form className={styles.form} onSubmit={handleRegister}>
                <label>
                  Username:
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Email:
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Password:
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Confirm Password:
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </label>
                <button type="submit">Register</button>
              </form>
              <p className={styles.smallText}>
                Already have an account?{' '}
                <button className={styles.linkButton} onClick={() => handleModeSwitch(modes.LOGIN)}>
                  Login
                </button>
              </p>
            </>
          )}

          {mode === modes.VERIFY && (
            <>
              <h2>Verify Account</h2>
              <form className={styles.form} onSubmit={handleVerifyOtp}>
                <label>
                  Username:
                  <input
                    type="text"
                    value={verifyUsername}
                    onChange={(e) => setVerifyUsername(e.target.value)}
                    required
                  />
                </label>
                <label>
                  OTP:
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </label>
                <button type="submit">Verify</button>
              </form>
              <div className={styles.inlineActions} style={{ marginTop: 12 }}>
                <button onClick={handleResendOtp}>Resend OTP</button>
              </div>
              <p className={styles.smallText}>
                Ready to login?{' '}
                <button className={styles.linkButton} onClick={() => handleModeSwitch(modes.LOGIN)}>
                  Go to Login
                </button>
              </p>
            </>
          )}

          {message && (
            <p
              className={`${styles.statusMessage} ${messageType === 'success' ? styles.statusSuccess : styles.statusError}`}
            >
              {message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
