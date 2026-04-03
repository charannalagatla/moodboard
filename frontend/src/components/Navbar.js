import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StreakBadge from './StreakBadge';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  const navTo = (path) => navigate(path);
  const isActive = (path) => pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => navTo('/')}>
        Mood<span>Board</span>
      </div>

      {user && (
        <div className="navbar-nav">
          <button className={isActive('/')} onClick={() => navTo('/')}>Write</button>
          <button className={isActive('/dashboard')} onClick={() => navTo('/dashboard')}>Dashboard</button>
          <button className={isActive('/history')} onClick={() => navTo('/history')}>History</button>

          <StreakBadge streak={user.streak?.current || 0} />

          <button
            className="nav-link"
            onClick={logoutUser}
            style={{ color: 'var(--text-faint)', marginLeft: 4 }}
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
