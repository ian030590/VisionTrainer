import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BestPEST } from '../assessment/bestPest';
import {
  getStrokeBounds,
  stimDeviceFromThresholder,
  stimThresholderFromDevice,
  logMARFromStrokePixels,
  decVAFromStrokePixels,
  formatSnellenFraction,
  lettersFromLogMAR,
} from '../assessment/acuityLogic';
import {
  clearCanvas,
  drawLandoltC,
  drawTumblingE,
  drawSloanLetter,
  drawPictureOptotype,
  drawGrating,
  getAlternativeCount,
  randomAlternative,
  LANDOLT_DIRECTION_LABELS,
  E_DIRECTION_LABELS,
  SLOAN_LETTERS,
  PICTURE_NAMES,
} from '../assessment/optotypeRenderer';
import type {
  TestType,
  LandoltDirection,
  EDirection,
  SloanLetterIndex,
  PictureIndex,
  GratingOrientation,
} from '../assessment/optotypeRenderer';
import { getActiveUser, getSetting } from '../utils/settings';
import { pixelFromDegree } from '../utils/spatialUtils';
import { SoundManager } from '../utils/soundManager';

type Phase = 'intro' | 'isi' | 'stimulus' | 'results';

interface TrialRecord {
  trial: number;
  presented: number;
  responded: number;
  correct: boolean;
  strokePx: number;
  logMAR: number;
}

export function AcuityTestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const testType = (searchParams.get('type') || 'landolt') as TestType;
  const totalTrials = parseInt(searchParams.get('trials') || '18', 10);

  const [phase, setPhase] = useState<Phase>('intro');
  const [trialRecords, setTrialRecords] = useState<TrialRecord[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pestRef = useRef<BestPEST | null>(null);
  const trialRef = useRef(0);
  const currentAlternativeRef = useRef(0);
  const strokeBoundsRef = useRef({ strokeMin: 0.5, strokeMax: 100 });
  const currentStrokePxRef = useRef(10);
  const recordsRef = useRef<TrialRecord[]>([]);
  const phaseRef = useRef<Phase>('intro');

  const userName = getActiveUser() || '未知使用者';
  const nAlternatives = getAlternativeCount(testType);

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Initialize and manage the test ──
  const startTest = useCallback(() => {
    SoundManager.init();
    const nAlt = getAlternativeCount(testType);
    pestRef.current = new BestPEST(nAlt);
    trialRef.current = 0;
    recordsRef.current = [];
    setTrialRecords([]);

    // Get canvas dimensions for stroke bounds
    strokeBoundsRef.current = getStrokeBounds(window.innerWidth, window.innerHeight);

    setPhase('isi');
    runNextTrial();
  }, [testType]);

  const runNextTrial = useCallback(() => {
    const pest = pestRef.current;
    if (!pest) return;

    trialRef.current += 1;
    if (trialRef.current > totalTrials) {
      setTrialRecords([...recordsRef.current]);
      setPhase('results');
      return;
    }

    // Get next stimulus from BestPEST
    const tPest = pest.nextStim2apply();
    const { strokeMin, strokeMax } = strokeBoundsRef.current;
    const strokePx = stimDeviceFromThresholder(tPest, strokeMin, strokeMax);
    currentStrokePxRef.current = strokePx;

    // Generate random alternative
    currentAlternativeRef.current = randomAlternative(testType);

    // ISI phase (blank screen)
    setPhase('isi');
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) clearCanvas(ctx, canvas.width, canvas.height);
    }

    // Show stimulus after ISI delay
    setTimeout(() => {
      drawStimulus();
      setPhase('stimulus');
    }, 300);
  }, [testType, totalTrials]);

  const drawStimulus = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    clearCanvas(ctx, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const strokePx = currentStrokePxRef.current;
    const alt = currentAlternativeRef.current;

    switch (testType) {
      case 'landolt':
        drawLandoltC(ctx, cx, cy, strokePx, alt as LandoltDirection);
        break;
      case 'tumblingE':
        drawTumblingE(ctx, cx, cy, strokePx, (alt * 2) as EDirection);
        break;
      case 'letters':
        drawSloanLetter(ctx, cx, cy, strokePx, alt as SloanLetterIndex);
        break;
      case 'pictures':
        drawPictureOptotype(ctx, cx, cy, strokePx, alt as PictureIndex);
        break;
      case 'gratings': {
        const pixPerDeg = pixelFromDegree(1);
        // spatial frequency based on stroke size
        const cpd = 30 / Math.pow(10, logMARFromStrokePixels(strokePx));
        const diameter = Math.min(canvas.width, canvas.height) * 0.6;
        const orient: GratingOrientation = alt === 0 ? 'left' : 'right';
        // Draw grating on one side, uniform on other
        const offset = (orient === 'left' ? -1 : 1) * canvas.width * 0.2;
        drawGrating(ctx, cx + offset, cy, diameter, cpd, orient, pixPerDeg);
        // Draw uniform circle on other side
        const otherOffset = -offset;
        ctx.save();
        ctx.translate(cx + otherOffset, cy);
        ctx.fillStyle = '#484F58';
        ctx.beginPath();
        ctx.arc(0, 0, diameter / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }
    }

    // Draw trial info
    ctx.fillStyle = '#484F58';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(
      `${trialRef.current}/${totalTrials}`,
      12, 20,
    );
  }, [testType, totalTrials]);

  // ── Handle response ──
  const handleResponse = useCallback((responseIdx: number) => {
    if (phaseRef.current !== 'stimulus') return;

    const pest = pestRef.current;
    if (!pest) return;

    const presented = currentAlternativeRef.current;
    const correct = responseIdx === presented;
    const strokePx = currentStrokePxRef.current;
    const { strokeMin, strokeMax } = strokeBoundsRef.current;

    // Record
    const logMAR = logMARFromStrokePixels(strokePx);
    const record: TrialRecord = {
      trial: trialRef.current,
      presented,
      responded: responseIdx,
      correct,
      strokePx,
      logMAR,
    };
    recordsRef.current.push(record);

    // Feed back to BestPEST
    const tPest = stimThresholderFromDevice(strokePx, strokeMin, strokeMax);
    pest.enterTrialOutcome(tPest, correct);

    // Audio feedback
    if (getSetting('auditoryFeedbackEnabled')) {
      if (correct) {
        SoundManager.playCorrect();
      } else {
        SoundManager.playIncorrect();
      }
    }

    // Next trial
    runNextTrial();
  }, [runNextTrial]);

  // ── Keyboard handler ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phaseRef.current === 'intro') {
        if (e.key === ' ' || e.key === 'Enter') {
          startTest();
        }
        return;
      }
      if (phaseRef.current !== 'stimulus') return;

      let responseIdx = -1;

      switch (testType) {
        case 'landolt':
          // Numpad ONLY for Landolt C
          const landoltKeyMap: Record<string, number> = {
            '6': 0, '9': 1, '8': 2, '7': 3, '4': 4, '1': 5, '2': 6, '3': 7,
          };
          responseIdx = landoltKeyMap[e.key] ?? -1;
          break;

        case 'tumblingE':
          // Arrow keys ONLY for Tumbling E
          const tumblingEKeyMap: Record<string, number> = {
            ArrowRight: 0, ArrowUp: 1, ArrowLeft: 2, ArrowDown: 3,
          };
          responseIdx = tumblingEKeyMap[e.key] ?? -1;
          break;

        case 'pictures':
          const picturesKeyMap: Record<string, number> = {
            ArrowRight: 0, '6': 0, ArrowUp: 1, '8': 1, ArrowLeft: 2, '4': 2, ArrowDown: 3, '2': 3,
          };
          responseIdx = picturesKeyMap[e.key] ?? -1;
          break;

        case 'letters':
          const letterMap: Record<string, number> = {
            c: 0, C: 0, d: 1, D: 1, h: 2, H: 2, k: 3, K: 3, n: 4, N: 4,
            o: 5, O: 5, r: 6, R: 6, s: 7, S: 7, v: 8, V: 8, z: 9, Z: 9,
          };
          responseIdx = letterMap[e.key] ?? -1;
          break;

        case 'gratings':
          const gratingMap: Record<string, number> = {
            ArrowLeft: 0, '4': 0,
            ArrowRight: 1, '6': 1,
          };
          responseIdx = gratingMap[e.key] ?? -1;
          break;
      }

      // Escape to abort
      if (e.key === 'Escape') {
        navigate('/assessment');
        return;
      }

      if (responseIdx >= 0) {
        handleResponse(responseIdx);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [testType, startTest, handleResponse, navigate]);

  // ── Resize handler ──
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      strokeBoundsRef.current = getStrokeBounds(canvas.width, canvas.height);
      if (phaseRef.current === 'stimulus') {
        drawStimulus();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawStimulus]);

  // ── Intro Phase ──
  if (phase === 'intro') {
    return (
      <div className="experiment-container">
        <div className="acuity-intro">
          <h1>{getTestTitle(testType)}</h1>
          <p>{getTestInstruction(testType)}</p>
          <div className="acuity-intro-keys">
            {getKeyHints(testType)}
          </div>
          <button className="btn btn-primary btn-lg" onClick={startTest}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            開始測驗
          </button>
          <p className="acuity-intro-hint">
            按空白鍵或 Enter 也可開始 · 按 Esc 隨時退出
          </p>
        </div>
      </div>
    );
  }

  // ── Running Phase (ISI + Stimulus) ──
  if (phase === 'isi' || phase === 'stimulus') {
    return (
      <div className="experiment-container">
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
        {/* Touch controls */}
        <div className="acuity-touch-controls">
          {renderTouchButtons(testType, handleResponse)}
        </div>
        {/* Abort button */}
        <button
          className="acuity-abort-btn"
          onClick={() => navigate('/assessment')}
          title="退出測驗"
        >
          ✕
        </button>
      </div>
    );
  }

  // ── Results Phase ──
  const records = trialRecords;
  const finalStrokePx = records.length > 0 ? records[records.length - 1].strokePx : 10;
  const finalLogMAR = logMARFromStrokePixels(finalStrokePx);
  const finalDecVA = decVAFromStrokePixels(finalStrokePx);
  const finalSnellen = formatSnellenFraction(finalDecVA);
  const finalLetterScore = Math.round(lettersFromLogMAR(finalLogMAR));
  const correctCount = records.filter((r) => r.correct).length;

  const downloadCSV = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false }).replace(/:/g, '');
    const prefix = getSetting('downloadDirectory');

    const headers = ['使用者', '日期', '時間', '測驗', '試驗', '呈現', '回應', '正確', 'LogMAR', 'StrokePx'];
    const rows = records.map((r) => [
      userName, dateStr, timeStr, testType, r.trial,
      r.presented, r.responded, r.correct ? '✓' : '✗',
      r.logMAR.toFixed(3), r.strokePx.toFixed(2),
    ]);
    rows.push([]);
    rows.push(['最終結果']);
    rows.push(['LogMAR', finalLogMAR.toFixed(2)]);
    rows.push(['十進制視力', finalDecVA.toFixed(2)]);
    rows.push(['Snellen', finalSnellen]);
    rows.push(['Letter Score', String(finalLetterScore)]);
    rows.push(['正確率', `${correctCount}/${records.length}`]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix ? prefix + '_' : ''}${userName}_acuity_${testType}_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="experiment-container" style={{ overflowY: 'auto' }}>
      <div className="acuity-results">
        <h1>測驗結束！</h1>

        <div className="acuity-result-cards">
          <div className="acuity-result-card">
            <div className="acuity-result-label">LogMAR</div>
            <div className="acuity-result-value">{finalLogMAR.toFixed(2)}</div>
          </div>
          <div className="acuity-result-card">
            <div className="acuity-result-label">十進制視力</div>
            <div className="acuity-result-value">{finalDecVA.toFixed(2)}</div>
          </div>
          <div className="acuity-result-card">
            <div className="acuity-result-label">Snellen</div>
            <div className="acuity-result-value">{finalSnellen}</div>
          </div>
          <div className="acuity-result-card">
            <div className="acuity-result-label">Letter Score</div>
            <div className="acuity-result-value">{finalLetterScore}</div>
          </div>
        </div>

        <div className="acuity-result-meta">
          <span>測驗: <b>{getTestTitle(testType)}</b></span>
          <span>正確率: <b style={{ color: 'var(--accent)' }}>{correctCount}/{records.length}</b></span>
          <span>使用者: <b>{userName}</b></span>
        </div>

        {/* Trial history */}
        <table className="results-table">
          <thead>
            <tr>
              <th>試驗</th>
              <th>呈現</th>
              <th>回應</th>
              <th>正確</th>
              <th>LogMAR</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i}>
                <td>{r.trial}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                  {formatAlternative(testType, r.presented)}
                </td>
                <td>{formatAlternative(testType, r.responded)}</td>
                <td style={{ color: r.correct ? 'var(--success)' : 'var(--error)' }}>
                  {r.correct ? '✓' : '✗'}
                </td>
                <td>{r.logMAR.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="results-actions">
          <button className="btn btn-primary btn-lg" onClick={downloadCSV}>
            📥 下載 CSV 結果
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/assessment')}>
            ← 返回評估頁面
          </button>
        </div>

        <p className="acuity-disclaimer-footer">
          本測驗參考 FrACT 測驗模式以及演算法，為程式練習所用。若要了解自己視力，請尋求專業醫療協助。
        </p>
      </div>
    </div>
  );
}

// ── Helpers ──

function getTestTitle(t: TestType): string {
  const map: Record<TestType, string> = {
    landolt: '蘭氏環 (Landolt C)',
    tumblingE: '翻轉 E (Tumbling E)',
    letters: 'Sloan 字母',
    pictures: '圖形視標',
    gratings: '條紋視力 (PL)',
  };
  return map[t];
}

function getTestInstruction(t: TestType): string {
  switch (t) {
    case 'landolt':
      return '每次畫面中央會出現一個環形（蘭氏環），請辨別環形缺口的方向，使用數字鍵盤回答。';
    case 'tumblingE':
      return '每次畫面中央會出現一個 E 字母，請辨別 E 的開口方向，使用方向鍵回答。';
    case 'letters':
      return '每次畫面中央會出現一個字母（C D H K N O R S V Z），請按鍵盤上對應的字母鍵回答。';
    case 'pictures':
      return '每次畫面中央會出現一個圖形（房子、圓形、正方形、星星），請使用方向鍵回答：→房子 ↑圓形 ←正方形 ↓星星。';
    case 'gratings':
      return '畫面會出現兩個圓形區域，其中一個有條紋。請判斷條紋在左側還是右側，使用左右方向鍵回答。';
  }
}

function getKeyHints(t: TestType): React.ReactNode {
  switch (t) {
    case 'landolt':
      return (
        <div className="key-hints-grid-8">
          {([3, 2, 1, 4, -1, 0, 5, 6, 7] as number[]).map((dir, i) => (
            <div key={i} className={`key-hint ${dir === -1 ? 'key-hint-empty' : ''}`}>
              {dir >= 0 ? LANDOLT_DIRECTION_LABELS[dir as LandoltDirection] : ''}
            </div>
          ))}
        </div>
      );
    case 'tumblingE':
    case 'pictures':
      return (
        <div className="key-hints-grid-4">
          <div className="key-hint" style={{ gridColumn: 2, gridRow: 1 }}>↑</div>
          <div className="key-hint" style={{ gridColumn: 1, gridRow: 2 }}>←</div>
          <div className="key-hint" style={{ gridColumn: 3, gridRow: 2 }}>→</div>
          <div className="key-hint" style={{ gridColumn: 2, gridRow: 3 }}>↓</div>
        </div>
      );
    case 'letters':
      return (
        <div className="key-hints-letters">
          {SLOAN_LETTERS.map((l) => (
            <div key={l} className="key-hint">{l}</div>
          ))}
        </div>
      );
    case 'gratings':
      return (
        <div className="key-hints-grid-4">
          <div className="key-hint" style={{ gridColumn: 1, gridRow: 2 }}>← 左</div>
          <div className="key-hint" style={{ gridColumn: 3, gridRow: 2 }}>右 →</div>
        </div>
      );
  }
}

function renderTouchButtons(testType: TestType, onResponse: (idx: number) => void): React.ReactNode {
  switch (testType) {
    case 'landolt':
      return (
        <div className="touch-btn-ring">
          {([0, 1, 2, 3, 4, 5, 6, 7] as LandoltDirection[]).map((dir) => {
            const angle = -(dir / 8) * 2 * Math.PI;
            const r = 38; // % from center
            const left = 50 + Math.cos(angle) * r;
            const top = 50 + Math.sin(angle) * r;
            return (
              <button
                key={dir}
                className="direction-btn"
                style={{ left: `${left}%`, top: `${top}%` }}
                onClick={() => onResponse(dir)}
              >
                {LANDOLT_DIRECTION_LABELS[dir]}
              </button>
            );
          })}
        </div>
      );
    case 'tumblingE':
    case 'pictures':
      return (
        <div className="touch-btn-cross">
          <button className="direction-btn dir-up" onClick={() => onResponse(1)}>↑</button>
          <button className="direction-btn dir-left" onClick={() => onResponse(2)}>←</button>
          <button className="direction-btn dir-right" onClick={() => onResponse(0)}>→</button>
          <button className="direction-btn dir-down" onClick={() => onResponse(3)}>↓</button>
        </div>
      );
    case 'letters':
      return (
        <div className="touch-btn-letters">
          {SLOAN_LETTERS.map((l, i) => (
            <button key={l} className="direction-btn letter-btn" onClick={() => onResponse(i)}>
              {l}
            </button>
          ))}
        </div>
      );
    case 'gratings':
      return (
        <div className="touch-btn-cross">
          <button className="direction-btn dir-left" onClick={() => onResponse(0)}>← 左</button>
          <button className="direction-btn dir-right" onClick={() => onResponse(1)}>右 →</button>
        </div>
      );
  }
}

function formatAlternative(testType: TestType, idx: number): string {
  switch (testType) {
    case 'landolt':
      return LANDOLT_DIRECTION_LABELS[idx as LandoltDirection] || String(idx);
    case 'tumblingE':
      return E_DIRECTION_LABELS[(idx * 2) as EDirection] || String(idx);
    case 'letters':
      return SLOAN_LETTERS[idx] || String(idx);
    case 'pictures':
      return PICTURE_NAMES[idx] || String(idx);
    case 'gratings':
      return idx === 0 ? '左' : '右';
  }
}
