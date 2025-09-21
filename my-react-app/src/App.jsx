
import { useState } from 'react';
import style from './App.module.css';
function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would send username/password to your backend
    if (username && password) {
      setMessage('Login successful (demo)');
    } else {
      setMessage('Please enter both username and password');
    }
  };

  return (
    <div className="login-container">
      <h1>Futsal Reservation System Login</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Username or Email:
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default App

