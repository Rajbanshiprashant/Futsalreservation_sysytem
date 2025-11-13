
import { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';

function App() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error'); // 'error' | 'success'
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setMessage('');
    if (!username || !password) {
      setMessageType('error');
      setMessage('Please enter both username and password');
      return;
    }

    fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setMessage('');
      })
      .catch((err) => {
        setMessageType('error');
        setMessage(err.message);
      });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setMessage('');
    // Client-side validation
    if (!username) {
      setMessageType('error');
      setMessage('Username is required');
      return;
    }
    if (!password) {
      setMessageType('error');
      setMessage('Password is required');
      return;
    }
    if (password.length < 6) {
      setMessageType('error');
      setMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage('Passwords do not match');
      return;
    }

    fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email}),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        // Auto-login: call /api/login immediately
        const loginRes = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error || 'Auto-login failed');
        localStorage.setItem('token', loginData.token);
        setIsAuthenticated(true);
        setMessageType('success');
        setMessage('Registration successful. You are now logged in.');
        setPassword('');
        setConfirmPassword('');
      })
      .catch((err) => {
        setMessageType('error');
        setMessage(err.message);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setMessage('Logged out');
    setMessageType('success');
  };

  if (isAuthenticated) {
    return <Dashboard username={username} onLogout={handleLogout} />;
  }

  return (
    <div className="login-container">
      <h1>Futsal Reservation System</h1>

      {mode === 'login' ? (
        <>
          <h2>Login</h2>
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Username or Email:
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
          <p className="small">Don't have an account? <button className="link-button" onClick={() => { setMode('register'); setMessage(''); }}>Register now</button></p>
        </>
      ) : (
        <>
          <h2>Register</h2>
          <form className="login-form" onSubmit={handleRegister}>
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
          <p className="small">Already have an account? <button className="link-button" onClick={() => { setMode('login'); setMessage(''); }}>Login</button></p>
        </>
      )}

      {message && <p className={messageType === 'success' ? 'message-success' : 'message-error'}>{message}</p>}
    </div>
  );
}

export default App;

