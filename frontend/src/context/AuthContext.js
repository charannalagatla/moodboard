import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, rehydrate from localStorage
  useEffect(() => {
    const token = localStorage.getItem('mb_token');
    const stored = localStorage.getItem('mb_user');

    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {}
    }

    if (token) {
      getMe()
        .then(({ data }) => {
          setUser(data.user);
          localStorage.setItem('mb_user', JSON.stringify(data.user));
        })
        .catch(() => {
          // Token invalid — clear
          localStorage.removeItem('mb_token');
          localStorage.removeItem('mb_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = useCallback((token, userData) => {
    localStorage.setItem('mb_token', token);
    localStorage.setItem('mb_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logoutUser = useCallback(() => {
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
    setUser(null);
  }, []);

  // Update user streak after a new entry
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await getMe();
      setUser(data.user);
      localStorage.setItem('mb_user', JSON.stringify(data.user));
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
