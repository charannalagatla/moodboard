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

  // ── Mobile menu ───────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Months tracked (for NEW badge) ────────────────────────────
  const [months, setMonths] = useState(() => {
    return parseInt(localStorage.getItem('mb_months_tracked') || '0');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mb_theme', theme);
  }, [theme]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (path) => pathname === path ? 'nav-link active' : 'nav-link';

  const handleNav = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => handleNav('/')}>
        <em>mood</em><span>board</span>
      </div>

      {/* Mobile — theme + hamburger always visible */}
      <div className="navbar-right">
        <button className="theme-toggle-btn mobile-theme" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? '☀️' : '🌙'}
        </button>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
        {/* Desktop — theme btn inside nav */}
        <button className="theme-toggle-btn desktop-theme" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? '☀️' : '🌙'}
        </button>

        {user && (
          <>
            <button className={isActive('/')} onClick={() => handleNav('/')}>Write</button>
            <button className={isActive('/dashboard')} onClick={() => handleNav('/dashboard')}>Dashboard</button>
            <button className={isActive('/history')} onClick={() => handleNav('/history')}>History</button>
            <button className={isActive('/journey')} onClick={() => handleNav('/journey')}>
              Journey {months < 2 && <span className="nav-new-badge">new</span>}
            </button>
            <StreakBadge streak={user.streak?.current || 0} />
            <button className="nav-link" onClick={() => { logoutUser(); setMenuOpen(false); }} style={{ color: 'var(--text-faint)', marginLeft: 4 }}>
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}