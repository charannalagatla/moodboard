import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StreakBadge from './StreakBadge';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ── Theme toggle ──────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mb_theme') || 'light';
  });

  // ── Month Tracker ──────────────────────────────────────────────
  const [months, setMonths] = useState(() => {
  return parseInt(localStorage.getItem('mb_months_tracked') || '0');
});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mb_theme', theme);
  }, [theme]);

  const isActive = (path) => pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/')}>
        <em>mood</em><span>board</span>
      </div>

      <div className="navbar-nav">
        {/* Dark / light toggle */}
        <div className="theme-toggle">
          <button
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
            aria-label="Switch to light mode"
          >
            light
          </button>
          <button
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
            aria-label="Switch to dark mode"
          >
            dark
          </button>
        </div>

        {user && (
          <>
            <button className={isActive('/')}      onClick={() => navigate('/')}>Write</button>
            <button className={isActive('/dashboard')} onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className={isActive('/history')}   onClick={() => navigate('/history')}>History</button>
            <button className={isActive('/journey')} onClick={() => navigate('/journey')}>Journey {months < 2 && <span className="nav-new-badge">new</span>}</button>
            <StreakBadge streak={user.streak?.current || 0} />
            <button
              className="nav-link"
              onClick={logoutUser}
              style={{ color: 'var(--text-faint)', marginLeft: 4 }}
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}