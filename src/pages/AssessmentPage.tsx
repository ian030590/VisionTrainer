import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveUser, getSetting } from '../utils/settings';
import type { TestType } from '../assessment/optotypeRenderer';

const DISCLAIMER =
  '本測驗參考 FrACT 測驗模式以及演算法，為程式練習所用。若要了解自己視力，請尋求專業醫療協助。';

interface TestCard {
  id: TestType;
  title: string;
  desc: string;
  icon: ReactNode;
  nAlt: number;
  defaultTrials: number;
}

const TEST_CARDS: TestCard[] = [
  {
    id: 'landolt',
    title: '蘭氏環 (Landolt C)',
    desc: '辨別環形缺口方向，8 方向選擇。為國際標準視力檢測法之一。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.65 17.65A8 8 0 1 1 17.65 6.35" />
      </svg>
    ),
    nAlt: 8,
    defaultTrials: 18,
  },
  {
    id: 'tumblingE',
    title: '翻轉 E (Tumbling E)',
    desc: '辨別 E 字母的開口方向，適合不熟悉拉丁字母者。4 方向選擇。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 5h9 M8 12h7 M8 19h9 M8 5v14" />
      </svg>
    ),
    nAlt: 4,
    defaultTrials: 24,
  },
  {
    id: 'letters',
    title: 'Sloan 字母',
    desc: '辨別 10 個 Sloan 字母（C D H K N O R S V Z），國際視力表常用字母集。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" x2="15" y1="20" y2="20" />
        <line x1="12" x2="12" y1="4" y2="20" />
      </svg>
    ),
    nAlt: 10,
    defaultTrials: 18,
  },
  {
    id: 'pictures',
    title: '圖形視標',
    desc: '辨別簡易圖形（房子、圓形、正方形、星星），適合幼兒或無法辨識字母者。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    nAlt: 4,
    defaultTrials: 24,
  },
  {
    id: 'gratings',
    title: '條紋視力 (PL)',
    desc: 'Preferential Looking 條紋視力檢查，判斷條紋出現在左側或右側。適合嬰幼兒。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="8" y1="4.5" x2="8" y2="19.5" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="16" y1="4.5" x2="16" y2="19.5" />
      </svg>
    ),
    nAlt: 2,
    defaultTrials: 36,
  },
];

export function AssessmentPage() {
  const navigate = useNavigate();
  const activeUser = getActiveUser();
  const distanceCM = getSetting('distanceInCM');

  const [expandedTest, setExpandedTest] = useState<TestType | null>(null);
  const [localTrials, setLocalTrials] = useState<number>(18);
  const [customTrialsInput, setCustomTrialsInput] = useState('');

  const handleCardClick = (testId: TestType) => {
    if (!activeUser) {
      alert('請先選擇或新增一位使用者');
      return;
    }
    if (expandedTest === testId) {
      setExpandedTest(null);
    } else {
      setExpandedTest(testId);
      const card = TEST_CARDS.find((c) => c.id === testId)!;
      setLocalTrials(card.defaultTrials);
      setCustomTrialsInput('');
    }
  };

  const handleStartTest = () => {
    if (!expandedTest || !activeUser) return;
    navigate(
      `/acuity-test?type=${expandedTest}&trials=${localTrials}`,
    );
  };

  const handleTrialsPreset = (n: number) => {
    setLocalTrials(n);
    setCustomTrialsInput('');
  };

  const handleCustomTrials = (val: string) => {
    setCustomTrialsInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 100) {
      setLocalTrials(num);
    }
  };

  const expandedCard = TEST_CARDS.find((c) => c.id === expandedTest);
  const trialsPresets = [12, 18, 24, 36];

  return (
    <div className="page-content">
      {/* Disclaimer */}
      <div className="assessment-disclaimer fade-in">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{DISCLAIMER}</span>
      </div>

      <h1 className="section-title fade-in-up">視力評估</h1>
      <p className="section-subtitle fade-in-up">
        選擇評估項目，系統將自動調整視標大小以測定閾值
      </p>

      {/* Test Cards Grid */}
      <div className="assessment-grid">
        {TEST_CARDS.map((card) => (
          <div
            key={card.id}
            className={`card fade-in-up ${expandedTest === card.id ? 'card-active' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-icon" style={{ fontSize: 36 }}>{card.icon}</div>
            <div className="card-title">{card.title}</div>
            <div className="card-desc">{card.desc}</div>
            <div className="card-meta">
              <span>{card.nAlt} 選項</span>
              <span>•</span>
              <span>預設 {card.defaultTrials} 次</span>
            </div>
            <div className="card-expand-hint">
              {expandedTest === card.id ? '收合設定' : '選擇此測驗'}
              <svg
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{
                  transform: expandedTest === card.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Config Panel */}
      {expandedTest && expandedCard && (
        <div className="module-config-panel fade-in-up">
          <div className="config-section">
            <div className="config-label">試驗次數</div>
            <div className="rounds-selector">
              {trialsPresets.map((r) => (
                <button
                  key={r}
                  className={`rounds-btn ${localTrials === r && !customTrialsInput ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleTrialsPreset(r); }}
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
                value={customTrialsInput}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleCustomTrials(e.target.value)}
              />
            </div>
          </div>

          <div className="config-actions">
            <button
              className="btn btn-primary btn-lg config-start-btn"
              onClick={(e) => { e.stopPropagation(); handleStartTest(); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              開始測驗
            </button>
            <button
              className="btn btn-ghost btn-lg"
              onClick={(e) => { e.stopPropagation(); setExpandedTest(null); }}
            >
              取消
            </button>
          </div>

          <div className="config-summary">
            使用者: <strong>{activeUser}</strong> ·{' '}
            測驗: <strong>{expandedCard.title}</strong> ·{' '}
            試驗數: <strong>{localTrials}</strong> ·{' '}
            觀看距離: <strong>{distanceCM} cm</strong>
          </div>
        </div>
      )}
    </div>
  );
}
