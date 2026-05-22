import { NavLink } from 'react-router-dom';
import { getActiveUser } from '../utils/settings';

export function Navbar() {
  const user = getActiveUser();

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        VisualTrainer
      </NavLink>

      <div className="navbar-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
        >
          訓練清單
        </NavLink>
        <NavLink
          to="/assessment"
          className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
        >
          視力評估
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
        >
          設定與校正
        </NavLink>
      </div>

      <div className="navbar-user">
        {user ? (
          <>
            <span className="navbar-user-dot" />
            <span>{user}</span>
          </>
        ) : (
          <span style={{ color: 'var(--warning)' }}>未選擇使用者</span>
        )}
      </div>
    </nav>
  );
}
