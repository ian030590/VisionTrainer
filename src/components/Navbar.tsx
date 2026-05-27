import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getActiveUser } from '../utils/settings';
import { useT } from '../i18n';

export function Navbar() {
  const user = getActiveUser();
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
          <img src="/assets/logo.svg" alt="Vision Trainer Logo" height="22" style={{ width: 'auto', objectFit: 'contain' }} />
          {t('nav.brand')}
        </NavLink>

        <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        <div className={`navbar-menu ${isOpen ? 'is-open' : ''}`}>
          <div className="navbar-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {t('nav.trainingList')}
            </NavLink>
            <NavLink
              to="/assessment"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {t('nav.assessment')}
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {t('nav.settings')}
            </NavLink>
            <NavLink
              to="/credits"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {t('nav.credits')}
            </NavLink>
          </div>

          <div className="navbar-user">
            {user ? (
              <>
                <span className="navbar-user-dot" />
                <span>{user}</span>
              </>
            ) : (
              <span style={{ color: 'var(--warning)' }}>{t('nav.noUser')}</span>
            )}
          </div>
        </div>
      </div>
      {isOpen && <div className="navbar-overlay" onClick={closeMenu} />}
    </nav>
  );
}
