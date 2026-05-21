import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { initJsPsych } from 'jspsych';
import type { JsPsych } from 'jspsych';
import PixiMovingCardPlugin from '../experiment/plugins/pixi-moving-card';
import { buildTimeline } from '../experiment/timeline';
import { getActiveUser, getSetting } from '../utils/settings';

// Ensure the plugin class is referenced so bundler doesn't tree-shake it
void PixiMovingCardPlugin;

type Phase = 'running' | 'results';

interface TrialData {
  trial_index: number;
  rt: number;
  correct: boolean;
  target: string;
  response: string;
}

export function ExperimentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('module') || 'moving-card';
  const difficulty = searchParams.get('difficulty') || getSetting('difficulty');
  const totalRounds = parseInt(searchParams.get('rounds') || '', 10) || getSetting('totalRounds');

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

    const timeline = buildTimeline(moduleId, { difficulty, totalRounds });
    jsPsych.run(timeline as any);

    // Cleanup on unmount
    return () => {
      if (jsPsychRef.current) {
        jsPsychRef.current = null;
      }
    };
  }, [phase, moduleId, difficulty, totalRounds]);

  const downloadCSV = useCallback(() => {
    if (results.length === 0) return;

    const prefix = getSetting('downloadDirectory');
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false }).replace(/:/g, '');

    const headers = ['使用者', '日期', '時間', '模組', '難度', '回合', '題目', '作答', '正確', '反應時間(ms)'];
    const rows: (string | number)[][] = results.map((r, i) => [
      userName,
      dateStr,
      timeStr,
      moduleId,
      difficulty,
      i + 1,
      r.target,
      r.response,
      r.correct ? '✓' : '✗',
      r.rt,
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
  }, [results, userName, moduleId, difficulty]);

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

  return (
    <div className="experiment-container" style={{ overflowY: 'auto' }}>
      <div className="experiment-results">
        <h1 style={{ fontSize: 32 }}>訓練結束！</h1>
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
