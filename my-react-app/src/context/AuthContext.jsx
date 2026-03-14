import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext();

const tokenKey = 'token';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profile = await apiClient.get('/api/auth/profile', { token });
        setUser(profile);
      } catch (error) {
        console.error(error);
        localStorage.removeItem(tokenKey);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const login = (newToken, profile) => {
    localStorage.setItem(tokenKey, newToken);
    localStorage.setItem('user', JSON.stringify(profile));
    setToken(newToken);
    setUser(profile);
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, login, logout, updateUser, loading }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
