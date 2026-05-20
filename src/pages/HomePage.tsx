import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUsers,
  addUser,
  removeUser,
  getActiveUser,
  setActiveUser,
  getSetting,
  isCalibrated,
} from '../utils/settings';

export function HomePage() {
  const navigate = useNavigate();
  const [users, setUsersState] = useState(getUsers);
  const [activeUser, setActiveUserState] = useState(getActiveUser);
  const [newName, setNewName] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  const refreshUsers = useCallback(() => {
    setUsersState(getUsers());
    setActiveUserState(getActiveUser());
  }, []);

  const handleSelectUser = (name: string) => {
    setActiveUser(name || null);
    setActiveUserState(name || null);
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
    if (confirm(`確定要刪除使用者「${name}」嗎？`)) {
      removeUser(name);
      refreshUsers();
    }
  };

  const handleStartTraining = (moduleId: string) => {
    if (!activeUser) {
      alert('請先選擇或新增一位使用者');
      return;
    }
    navigate(`/experiment?module=${moduleId}`);
  };

  const calibrated = isCalibrated();
  const difficulty = getSetting('difficulty');
  const totalRounds = getSetting('totalRounds');
  const diffLabel: Record<string, string> = {
    beginner: '初級 (網格)',
    intermediate: '中級 (散落)',
    advanced: '高級 (旋轉)',
  };

  return (
    <div className="page-content">
      {/* ── User Selector ── */}
      <div className="user-selector">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <select
          value={activeUser || ''}
          onChange={(e) => handleSelectUser(e.target.value)}
        >
          <option value="">-- 選擇使用者 --</option>
          {users.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(!showAddUser)}>
          {showAddUser ? '取消' : '＋ 新增'}
        </button>
        {activeUser && (
          <button className="btn btn-danger btn-sm" onClick={() => handleRemoveUser(activeUser)}>
            刪除
          </button>
        )}
      </div>

      {/* ── Add User Form ── */}
      {showAddUser && (
        <div className="user-selector fade-in" style={{ marginTop: -16 }}>
          <input
            className="input"
            type="text"
            placeholder="輸入使用者名稱"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
            autoFocus
          />
          <button className="btn btn-primary btn-sm" onClick={handleAddUser}>
            確認新增
          </button>
        </div>
      )}

      {/* ── Status Bar ── */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 28,
        fontSize: 13,
        color: 'var(--text-secondary)',
      }}>
        <span style={{ color: calibrated ? 'var(--success)' : 'var(--warning)' }}>
          {calibrated ? '✓ 已校正螢幕' : '⚠ 尚未校正螢幕'}
        </span>
        <span>難度: {diffLabel[difficulty] || difficulty}</span>
        <span>回合數: {totalRounds}</span>
      </div>

      {/* ── Section Title ── */}
      <h1 className="section-title fade-in-up">訓練清單</h1>
      <p className="section-subtitle fade-in-up">選擇您想進行的訓練項目</p>

      {/* ── Training Cards ── */}
      <div className="training-grid">
        <div
          className="card fade-in-up"
          onClick={() => handleStartTraining('moving-card')}
        >
          <div className="card-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div className="card-title">移動卡片訓練</div>
          <div className="card-desc">
            訓練注視中心點時快速辨識移動卡片文字的能力，字母選項會動態移動增加難度。
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            fontSize: 13,
            color: 'var(--accent)',
            fontWeight: 600,
          }}>
            開始訓練
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Placeholder for future modules */}
        <div
          className="card"
          style={{ opacity: 0.4, cursor: 'default', borderStyle: 'dashed' }}
          onClick={() => {}}
        >
          <div className="card-icon" style={{ color: 'var(--text-muted)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div className="card-title" style={{ color: 'var(--text-muted)' }}>更多模組</div>
          <div className="card-desc">即將推出更多訓練模組…</div>
        </div>
      </div>
    </div>
  );
}
