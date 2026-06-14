import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import {
  ACTIVE_USER_CHANGED_EVENT,
  addUser,
  getUsers,
  removeUser,
  setActiveUser,
} from '../utils/settings';
import { useActiveUser } from '../utils/useActiveUser';

interface UserSelectorProps {
  onUserChange?: (name: string | null) => void;
}

export function UserSelector({ onUserChange }: UserSelectorProps) {
  const { t } = useT();
  const [users, setUsers] = useState(getUsers);
  const activeUser = useActiveUser();
  const [newName, setNewName] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  useEffect(() => {
    refreshUsers();
    window.addEventListener('storage', refreshUsers);
    window.addEventListener(ACTIVE_USER_CHANGED_EVENT, refreshUsers);
    return () => {
      window.removeEventListener('storage', refreshUsers);
      window.removeEventListener(ACTIVE_USER_CHANGED_EVENT, refreshUsers);
    };
  }, []);

  useEffect(() => {
    onUserChange?.(activeUser);
  }, [activeUser, onUserChange]);

  const handleSelectUser = (name: string) => {
    const nextActiveUser = name || null;
    setActiveUser(nextActiveUser);
  };

  const handleAddUser = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addUser(trimmed);
    setActiveUser(trimmed);
    setNewName('');
    setShowAddUser(false);
    refreshUsers();
  };

  const handleRemoveUser = (name: string) => {
    if (!confirm(t('home.deleteUserPrompt', { name }))) return;
    removeUser(name);
    refreshUsers();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <>
      <div className="user-selector">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <select
          value={activeUser || ''}
          onChange={(e) => handleSelectUser(e.target.value)}
        >
          <option value="">{t('home.selectUser')}</option>
          {users.map((user) => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(!showAddUser)}>
          {showAddUser ? t('btn.cancel') : t('btn.add')}
        </button>
        {activeUser && (
          <button className="btn btn-danger btn-sm" onClick={() => handleRemoveUser(activeUser)}>
            {t('btn.delete')}
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleToggleFullscreen}
          title={t('home.toggleFullscreen')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
      </div>

      {showAddUser && (
        <div className="user-selector fade-in user-selector-add">
          <input
            className="input"
            type="text"
            placeholder={t('home.enterUserName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
            autoFocus
          />
          <button className="btn btn-primary btn-sm" onClick={handleAddUser}>
            {t('btn.confirmAdd')}
          </button>
        </div>
      )}
    </>
  );
}
