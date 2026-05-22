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
import {
  oculomotorModes,
  oculomotorPatterns,
} from '../oculomotor/presets';
import type { OculomotorMode, OculomotorPattern } from '../oculomotor/types';

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
  const [oculomotorMode, setOculomotorMode] = useState<OculomotorMode>(
    () => getSetting('oculomotorMode'),
  );
  const [oculomotorPattern, setOculomotorPattern] = useState<OculomotorPattern>(
    () => getSetting('oculomotorPattern'),
  );
  const [oculomotorDurationSec, setOculomotorDurationSec] = useState(
    () => getSetting('oculomotorDurationSec'),
  );
  const [oculomotorSpeedDegPerSec, setOculomotorSpeedDegPerSec] = useState(
    () => getSetting('oculomotorSpeedDegPerSec'),
  );
  const [oculomotorTargetSizeMm, setOculomotorTargetSizeMm] = useState(
    () => getSetting('oculomotorTargetSizeMm'),
  );
  const [oculomotorDistractorCount, setOculomotorDistractorCount] = useState(
    () => getSetting('oculomotorDistractorCount'),
  );
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

  useEffect(() => {
    setSetting('oculomotorMode', oculomotorMode);
  }, [oculomotorMode]);

  useEffect(() => {
    setSetting('oculomotorPattern', oculomotorPattern);
  }, [oculomotorPattern]);

  useEffect(() => {
    setSetting('oculomotorDurationSec', oculomotorDurationSec);
  }, [oculomotorDurationSec]);

  useEffect(() => {
    setSetting('oculomotorSpeedDegPerSec', oculomotorSpeedDegPerSec);
  }, [oculomotorSpeedDegPerSec]);

  useEffect(() => {
    setSetting('oculomotorTargetSizeMm', oculomotorTargetSizeMm);
  }, [oculomotorTargetSizeMm]);

  useEffect(() => {
    setSetting('oculomotorDistractorCount', oculomotorDistractorCount);
  }, [oculomotorDistractorCount]);

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
    const params = new URLSearchParams({
      module: expandedModule,
      difficulty: localDifficulty,
      rounds: String(localRounds),
    });

    if (expandedModule === 'oculomotor-training') {
      params.set('mode', oculomotorMode);
      params.set('pattern', oculomotorPattern);
      params.set('duration', String(oculomotorDurationSec));
      params.set('speed', String(oculomotorSpeedDegPerSec));
      params.set('size', String(oculomotorTargetSizeMm));
      params.set('distractors', String(oculomotorDistractorCount));
    }

    navigate(`/experiment?${params.toString()}`);
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
  const durationPresets = [30, 60, 90, 120];
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
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.();
            } else {
              document.exitFullscreen?.();
            }
          }}
          title="切換全螢幕"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
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

        <div
          className={`card fade-in-up ${expandedModule === 'oculomotor-training' ? 'card-active' : ''}`}
          onClick={() => handleCardClick('oculomotor-training')}
        >
          <div className="card-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2.5" />
              <path d="M12 3a9 9 0 0 1 9 9" />
              <path d="M21 12a9 9 0 0 1-9 9" />
              <path d="M12 21a9 9 0 0 1-9-9" />
              <path d="M3 12a9 9 0 0 1 9-9" />
              <path d="M12 7v2" />
              <path d="M17 12h-2" />
              <path d="M12 17v-2" />
              <path d="M7 12h2" />
            </svg>
          </div>
          <div className="card-title">眼動訓練 Oculomotor Training</div>
          <div className="card-desc">
            重製 FoveaFlow 的追視、跳視、多目標追蹤與 Lilac Chaser 周邊固視訓練。
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
            {expandedModule === 'oculomotor-training' ? '收合設定' : '選擇此模組'}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{
                transform: expandedModule === 'oculomotor-training' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Module Config Panel ── */}
      {expandedModule === 'moving-card' && (
        <div className="config-modal-overlay fade-in" onClick={() => setExpandedModule(null)}>
          <div className="module-config-panel config-modal-panel" onClick={(e) => e.stopPropagation()}>
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
        </div>
      )}

      {expandedModule === 'oculomotor-training' && (
        <div className="config-modal-overlay fade-in" onClick={() => setExpandedModule(null)}>
          <div className="module-config-panel config-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="config-section">
              <div className="config-label">訓練模式</div>
              <div className="difficulty-selector">
                {oculomotorModes.map((mode) => (
                  <button
                    key={mode.id}
                    className={`diff-btn ${oculomotorMode === mode.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOculomotorMode(mode.id);
                    }}
                  >
                    <span className="diff-btn-label">{mode.label}</span>
                    <span className="diff-btn-desc">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {oculomotorMode !== 'lilac-chaser' && (
              <div className="config-section">
                <div className="config-label">移動路徑</div>
                <select
                  className="input"
                  value={oculomotorPattern}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setOculomotorPattern(e.target.value as OculomotorPattern)}
                >
                  {oculomotorPatterns.map((pattern) => (
                    <option key={pattern.id} value={pattern.id}>{pattern.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="config-section">
              <div className="config-label">時長（秒）</div>
              <div className="rounds-selector">
                {durationPresets.map((duration) => (
                  <button
                    key={duration}
                    className={`rounds-btn ${oculomotorDurationSec === duration ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOculomotorDurationSec(duration);
                    }}
                  >
                    {duration}
                  </button>
                ))}
                <input
                  className="rounds-custom-input"
                  type="number"
                  min="15"
                  max="300"
                  value={oculomotorDurationSec}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (Number.isFinite(value)) {
                      setOculomotorDurationSec(Math.max(15, Math.min(300, value)));
                    }
                  }}
                />
              </div>
            </div>

            <div className="config-section">
              <div className="config-label">速度與目標大小</div>
              <div className="difficulty-selector">
                <label className="diff-btn" style={{ cursor: 'default', alignItems: 'stretch' }}>
                  <span className="diff-btn-desc">速度 deg/s</span>
                  <input
                    className="rounds-custom-input"
                    type="number"
                    min="2"
                    max="80"
                    value={oculomotorSpeedDegPerSec}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (Number.isFinite(value)) {
                        setOculomotorSpeedDegPerSec(Math.max(2, Math.min(80, value)));
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </label>
                <label className="diff-btn" style={{ cursor: 'default', alignItems: 'stretch' }}>
                  <span className="diff-btn-desc">大小 mm</span>
                  <input
                    className="rounds-custom-input"
                    type="number"
                    min="2"
                    max="50"
                    value={oculomotorTargetSizeMm}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (Number.isFinite(value)) {
                        setOculomotorTargetSizeMm(Math.max(2, Math.min(50, value)));
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </label>
                <label className="diff-btn" style={{ cursor: 'default', alignItems: 'stretch' }}>
                  <span className="diff-btn-desc">干擾數</span>
                  <input
                    className="rounds-custom-input"
                    type="number"
                    min="0"
                    max="12"
                    value={oculomotorDistractorCount}
                    disabled={oculomotorMode !== 'multi-object'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (Number.isFinite(value)) {
                        setOculomotorDistractorCount(Math.max(0, Math.min(12, value)));
                      }
                    }}
                    style={{ width: '100%', opacity: oculomotorMode === 'multi-object' ? 1 : 0.5 }}
                  />
                </label>
              </div>
            </div>

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

            <div className="config-summary">
              使用者: <strong>{activeUser}</strong> ·{' '}
              模式: <strong>{oculomotorModes.find((mode) => mode.id === oculomotorMode)?.label}</strong> ·{' '}
              時長: <strong>{oculomotorDurationSec}s</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
