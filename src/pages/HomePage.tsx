import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUsers,
  addUser,
  removeUser,
  getActiveUser,
  setActiveUser,
  getSetting,
  setSetting,
  isCalibrated,
} from '../utils/settings';
import { pixiAppManager } from '../utils/pixiPool';
import { SoundManager } from '../utils/soundManager';

export function HomePage() {
  const navigate = useNavigate();
  const [users, setUsersState] = useState(getUsers);
  const [activeUser, setActiveUserState] = useState(getActiveUser);
  const [newName, setNewName] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  // ── Module expansion state ──
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [localDifficulty, setLocalDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    () => getSetting('difficulty'),
  );
  const [localRounds, setLocalRounds] = useState<number>(() => getSetting('totalRounds'));
  const [customRoundsInput, setCustomRoundsInput] = useState('');
  const [prewarmed, setPrewarmed] = useState(() => pixiAppManager.ready);

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

  // ── Warm up PixiJS when module panel expands ──
  useEffect(() => {
    if (!expandedModule) return;
    if (pixiAppManager.ready) {
      setPrewarmed(true);
      return;
    }
    setPrewarmed(false);
    let cancelled = false;
    pixiAppManager.warmUp().then(() => {
      if (!cancelled) setPrewarmed(true);
    });
    return () => { cancelled = true; };
  }, [expandedModule]);

  // ── Persist settings when changed ──
  useEffect(() => {
    setSetting('difficulty', localDifficulty);
  }, [localDifficulty]);

  useEffect(() => {
    setSetting('totalRounds', localRounds);
  }, [localRounds]);

  // ── Handlers ──
  const handleCardClick = (moduleId: string) => {
    if (!activeUser) {
      alert('請先選擇或新增一位使用者');
      return;
    }
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const handleStartTraining = () => {
    if (!expandedModule || !activeUser) return;
    SoundManager.init();
    navigate(`/experiment?module=${expandedModule}&difficulty=${localDifficulty}&rounds=${localRounds}`);
  };

  const handleRoundsPreset = (rounds: number) => {
    setLocalRounds(rounds);
    setCustomRoundsInput('');
  };

  const handleCustomRoundsChange = (val: string) => {
    setCustomRoundsInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 100) {
      setLocalRounds(num);
    }
  };

  const calibrated = isCalibrated();
  const roundsPresets = [3, 5, 10, 15];
  const diffOptions: { key: 'beginner' | 'intermediate' | 'advanced'; label: string; desc: string }[] = [
    { key: 'beginner', label: '初級', desc: '網格排列' },
    { key: 'intermediate', label: '中級', desc: '散落排列' },
    { key: 'advanced', label: '高級', desc: '旋轉散落' },
  ];

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

      {/* ── Calibration Notice ── */}
      {!calibrated && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          padding: '10px 16px',
          background: 'rgba(210, 153, 34, 0.1)',
          border: '1px solid var(--warning)',
          borderRadius: 'var(--radius-m)',
          fontSize: 13,
          color: 'var(--warning)',
          maxWidth: 700,
          width: '100%',
        }}>
          ⚠ 尚未校正螢幕 — 前往設定頁校正以確保準確度
        </div>
      )}

      {/* ── Section Title ── */}
      <h1 className="section-title fade-in-up">訓練清單</h1>
      <p className="section-subtitle fade-in-up">選擇您想進行的訓練項目</p>

      {/* ── Training Cards ── */}
      <div className="training-grid">
        <div
          className={`card fade-in-up ${expandedModule === 'moving-card' ? 'card-active' : ''}`}
          onClick={() => handleCardClick('moving-card')}
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
            {expandedModule === 'moving-card' ? '收合設定' : '選擇此模組'}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{
                transform: expandedModule === 'moving-card' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            >
              <path d="M6 9l6 6 6-6" />
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

      {/* ── Module Config Panel ── */}
      {expandedModule === 'moving-card' && (
        <div className="module-config-panel fade-in-up">
          {/* Difficulty */}
          <div className="config-section">
            <div className="config-label">難度設定</div>
            <div className="difficulty-selector">
              {diffOptions.map((opt) => (
                <button
                  key={opt.key}
                  className={`diff-btn ${localDifficulty === opt.key ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setLocalDifficulty(opt.key); }}
                >
                  <span className="diff-btn-label">{opt.label}</span>
                  <span className="diff-btn-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rounds */}
          <div className="config-section">
            <div className="config-label">回合數</div>
            <div className="rounds-selector">
              {roundsPresets.map((r) => (
                <button
                  key={r}
                  className={`rounds-btn ${localRounds === r && !customRoundsInput ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleRoundsPreset(r); }}
                >
                  {r}
                </button>
              ))}
              <input
                className="rounds-custom-input"
                type="number"
                min="1"
                max="100"
                placeholder="自訂"
                value={customRoundsInput}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleCustomRoundsChange(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="config-actions">
            <button
              className="btn btn-primary btn-lg config-start-btn"
              onClick={(e) => { e.stopPropagation(); handleStartTraining(); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              開始訓練
              {prewarmed && <span className="ready-dot" />}
            </button>
            <button
              className="btn btn-ghost btn-lg"
              onClick={(e) => { e.stopPropagation(); setExpandedModule(null); }}
            >
              取消
            </button>
          </div>

          {/* Current settings summary */}
          <div className="config-summary">
            使用者: <strong>{activeUser}</strong> ·{' '}
            難度: <strong>{diffOptions.find((d) => d.key === localDifficulty)?.label}</strong> ·{' '}
            回合: <strong>{localRounds}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
