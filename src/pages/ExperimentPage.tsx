import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { initJsPsych } from 'jspsych';
import type { JsPsych } from 'jspsych';
import PixiMovingCardPlugin from '../experiment/plugins/pixi-moving-card';
import PixiOculomotorTrainingPlugin from '../experiment/plugins/pixi-oculomotor-training';
import { buildTimeline } from '../experiment/timeline';
import { getActiveUser, getSetting } from '../utils/settings';
import {
  getOculomotorModeLabel,
  getOculomotorPatternLabel,
  isOculomotorMode,
  isOculomotorPattern,
} from '../oculomotor/presets';

// Ensure the plugin class is referenced so bundler doesn't tree-shake it
void PixiMovingCardPlugin;
void PixiOculomotorTrainingPlugin;

type Phase = 'running' | 'results';

interface TrialData {
  trial_index: number;
  rt: number;
  correct: boolean;
  target: string;
  response: string;
  mode?: string;
  pattern?: string;
  acquired_targets?: number;
  average_fps?: number;
  duration_ms?: number;
}

export function ExperimentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('module') || 'moving-card';
  const difficulty = searchParams.get('difficulty') || getSetting('difficulty');
  const totalRounds = parseInt(searchParams.get('rounds') || '', 10) || getSetting('totalRounds');
  const requestedMode = searchParams.get('mode') || getSetting('oculomotorMode');
  const requestedPattern = searchParams.get('pattern') || getSetting('oculomotorPattern');
  const oculomotorMode = isOculomotorMode(requestedMode) ? requestedMode : getSetting('oculomotorMode');
  const oculomotorPattern = isOculomotorPattern(requestedPattern)
    ? requestedPattern
    : getSetting('oculomotorPattern');
  const oculomotorDurationSec = parseInt(searchParams.get('duration') || '', 10)
    || getSetting('oculomotorDurationSec');
  const oculomotorSpeedDegPerSec = parseFloat(searchParams.get('speed') || '')
    || getSetting('oculomotorSpeedDegPerSec');
  const oculomotorTargetSizeMm = parseFloat(searchParams.get('size') || '')
    || getSetting('oculomotorTargetSizeMm');
  const oculomotorDistractorCount = parseInt(searchParams.get('distractors') || '', 10);

  const [phase, setPhase] = useState<Phase>('running');
  const [results, setResults] = useState<TrialData[]>([]);
  const jsPsychRef = useRef<JsPsych | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const userName = getActiveUser() || '未知使用者';

  const diffLabel: Record<string, string> = {
    beginner: '初級 (網格)',
    intermediate: '中級 (散落)',
    advanced: '高級 (旋轉)',
  };

  // ── Launch jsPsych immediately (no instructions phase) ──
  useEffect(() => {
    if (phase !== 'running') return;
    if (!containerRef.current) return;
    if (jsPsychRef.current) return; // already initialized

    const container = containerRef.current;

    const jsPsych = initJsPsych({
      display_element: container,
      on_finish: () => {
        const data = jsPsych.data.get().values() as TrialData[];
        setResults(data);
        jsPsychRef.current = null;
        setPhase('results');
      },
    });

    jsPsychRef.current = jsPsych;

    const timeline = buildTimeline(moduleId, {
      difficulty,
      totalRounds,
      oculomotor: {
        mode: oculomotorMode,
        pattern: oculomotorPattern,
        durationSec: oculomotorDurationSec,
        speedDegPerSec: oculomotorSpeedDegPerSec,
        targetSizeMm: oculomotorTargetSizeMm,
        distractorCount: Number.isFinite(oculomotorDistractorCount)
          ? oculomotorDistractorCount
          : getSetting('oculomotorDistractorCount'),
      },
    });
    jsPsych.run(timeline as any);

    // Cleanup on unmount
    return () => {
      if (jsPsychRef.current) {
        jsPsychRef.current = null;
      }
    };
  }, [
    phase,
    moduleId,
    difficulty,
    totalRounds,
    oculomotorMode,
    oculomotorPattern,
    oculomotorDurationSec,
    oculomotorSpeedDegPerSec,
    oculomotorTargetSizeMm,
    oculomotorDistractorCount,
  ]);

  const downloadCSV = useCallback(() => {
    if (results.length === 0) return;

    const prefix = getSetting('downloadDirectory');
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false }).replace(/:/g, '');

    const isOculomotor = moduleId === 'oculomotor-training';
    const headers = isOculomotor
      ? ['使用者', '日期', '時間', '模組', '模式', '路徑', '時長(ms)', '反應點擊', '平均FPS', '狀態']
      : ['使用者', '日期', '時間', '模組', '難度', '回合', '題目', '作答', '正確', '反應時間(ms)'];
    const rows: (string | number)[][] = results.map((r, i) => [
      userName,
      dateStr,
      timeStr,
      moduleId,
      ...(isOculomotor
        ? [
            getOculomotorModeLabel(r.mode || oculomotorMode),
            getOculomotorPatternLabel(r.pattern || oculomotorPattern),
            r.duration_ms ?? r.rt,
            r.acquired_targets ?? 0,
            r.average_fps ?? '',
            r.response,
          ]
        : [
            difficulty,
            i + 1,
            r.target,
            r.response,
            r.correct ? '✓' : '✗',
            r.rt,
          ]),
    ]);

    const avgRt = Math.round(results.reduce((sum, r) => sum + r.rt, 0) / results.length);
    const correctCount = results.filter((r) => r.correct).length;
    rows.push(['']);
    rows.push(['平均反應時間', `${avgRt} ms`]);
    rows.push(['正確率', `${correctCount}/${results.length}`]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix ? prefix + '_' : ''}${userName}_${moduleId}_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, userName, moduleId, difficulty, oculomotorMode, oculomotorPattern]);

  const goHome = () => navigate('/');

  // ── Running Phase ──
  if (phase === 'running') {
    return (
      <div className="experiment-container">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }

  // ── Results Phase ──
  const avgRt = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.rt, 0) / results.length)
    : 0;
  const correctCount = results.filter((r) => r.correct).length;
  const sortedRts = [...results].map((r) => r.rt).sort((a, b) => a - b);
  const medianRt = sortedRts.length > 0
    ? (sortedRts.length % 2
      ? sortedRts[Math.floor(sortedRts.length / 2)]
      : Math.round((sortedRts[Math.floor(sortedRts.length / 2) - 1] + sortedRts[Math.floor(sortedRts.length / 2)]) / 2))
    : 0;
  const isOculomotor = moduleId === 'oculomotor-training';
  const oculomotorResult = results[0];

  return (
    <div className="experiment-container" style={{ overflowY: 'auto' }}>
      <div className="experiment-results">
        <h1 style={{ fontSize: 32 }}>訓練結束！</h1>
        {isOculomotor ? (
          <>
            <div className="results-score">
              {Math.round((oculomotorResult?.duration_ms ?? 0) / 1000)}s
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 24,
              marginBottom: 16,
              fontSize: 14,
              color: 'var(--text-secondary)',
            }}>
              <span>模式: <b style={{ color: 'var(--accent)' }}>{getOculomotorModeLabel(oculomotorResult?.mode || oculomotorMode)}</b></span>
              <span>路徑: <b style={{ color: 'var(--accent)' }}>{getOculomotorPatternLabel(oculomotorResult?.pattern || oculomotorPattern)}</b></span>
              <span>反應點擊: <b style={{ color: 'var(--accent)' }}>{oculomotorResult?.acquired_targets ?? 0}</b></span>
              <span>平均 FPS: <b style={{ color: 'var(--accent)' }}>{oculomotorResult?.average_fps ?? '-'}</b></span>
              <span>使用者: <b>{userName}</b></span>
            </div>
          </>
        ) : (
          <>
            <div className="results-score">{correctCount}/{results.length}</div>
            <div style={{
              display: 'flex',
              gap: 32,
              marginBottom: 16,
              fontSize: 14,
              color: 'var(--text-secondary)',
            }}>
              <span>平均 RT: <b style={{ color: 'var(--accent)' }}>{avgRt} ms</b></span>
              <span>中位數 RT: <b style={{ color: 'var(--accent)' }}>{medianRt} ms</b></span>
              <span>使用者: <b>{userName}</b></span>
            </div>

            <table className="results-table">
              <thead>
                <tr>
                  <th>回合</th>
                  <th>題目</th>
                  <th>作答</th>
                  <th>正確</th>
                  <th>反應時間 (ms)</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{r.target}</td>
                    <td>{r.response}</td>
                    <td style={{ color: r.correct ? 'var(--success)' : 'var(--error)' }}>
                      {r.correct ? '✓' : '✗'}
                    </td>
                    <td className={r.rt < avgRt ? 'rt-fast' : r.rt > avgRt * 1.5 ? 'rt-slow' : ''}>
                      {r.rt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="results-actions">
          <button className="btn btn-primary btn-lg" onClick={downloadCSV}>
            📥 下載 CSV 成績
          </button>
          <button className="btn btn-secondary btn-lg" onClick={goHome}>
            ← 返回首頁
          </button>
        </div>
      </div>
    </div>
  );
}
