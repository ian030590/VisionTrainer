import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { useT } from '../../i18n';
import {
  clampHartScale,
  createHartChart,
  createHartDecoder,
  createHartSeed,
  parseHartSeed,
} from './hartChart';
import type { CSSProperties, ChangeEvent } from 'react';
import type { HartCell, HartDecoderToken } from './hartChart';
import './hart-chart.css';

interface HartChartGridProps {
  cells: HartCell[];
  scale: number;
  hintedToken?: HartDecoderToken;
  hintsEnabled?: boolean;
  chartOnly?: boolean;
}

function HartChartGrid({
  cells,
  scale,
  hintedToken,
  hintsEnabled = false,
  chartOnly = false,
}: HartChartGridProps) {
  const hint = hintsEnabled ? hintedToken?.coordinate : undefined;
  const style = chartOnly
    ? {
        '--hart-font-min': `${20 * scale}px`,
        '--hart-font-fluid': `${5.5 * scale}vmin`,
        '--hart-font-max': `${62 * scale}px`,
      } as CSSProperties
    : {
        '--hart-font-min': `${22 * scale}px`,
        '--hart-font-fluid': `${5.1 * scale}vmin`,
        '--hart-font-max': `${47 * scale}px`,
      } as CSSProperties;

  return (
    <div
      className={`hart-chart-grid ${chartOnly ? 'hart-chart-grid-only' : ''}`}
      style={style}
      aria-label="Hart chart"
    >
      {cells.map((cell) => {
        const isAxis = hint && (cell.row === hint.row || cell.col === hint.col);
        const isTarget = hint && cell.row === hint.row && cell.col === hint.col;
        const className = [
          'hart-chart-cell',
          isAxis ? 'hart-chart-cell-axis' : '',
          isTarget ? 'hart-chart-cell-target' : '',
        ].filter(Boolean).join(' ');

        return (
          <span className={className} key={`${cell.row}-${cell.col}`}>
            {cell.char}
          </span>
        );
      })}
    </div>
  );
}

export function HartChartPage() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const [seed, setSeed] = useState(createHartSeed);
  const [scale, setScale] = useState(1);
  const [decoderOpen, setDecoderOpen] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [activeTokenIndex, setActiveTokenIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const chart = useMemo(() => createHartChart(seed), [seed]);
  const decoder = useMemo(() => createHartDecoder(chart, seed), [chart, seed]);
  const shareUrl = useMemo(() => {
    const baseUrl = window.location.href.split('#')[0];
    const params = new URLSearchParams({
      seed: String(seed),
      scale: String(scale),
      lang,
    });
    return `${baseUrl}#/hart-chart/display?${params.toString()}`;
  }, [lang, scale, seed]);

  const decodableIndexes = useMemo(
    () => decoder.tokens
      .map((token, index) => token.coordinate ? index : -1)
      .filter((index) => index >= 0),
    [decoder.tokens],
  );

  const complete = decodableIndexes.length > 0
    && decodableIndexes.every((index) => answers[index] === decoder.tokens[index].char);

  useEffect(() => {
    setAnswers(Array(decoder.tokens.length).fill(''));
    setActiveTokenIndex(null);
    inputRefs.current = [];
  }, [decoder]);

  useEffect(() => {
    if (!qrOpen) return;

    let cancelled = false;
    void QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [qrOpen, shareUrl]);

  const resetChart = () => {
    setSeed(createHartSeed());
    setQrDataUrl('');
  };

  const handleAnswer = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^a-z]/gi, '').slice(-1).toUpperCase();
    const nextAnswers = [...answers];
    nextAnswers[index] = value;
    setAnswers(nextAnswers);

    if (value !== decoder.tokens[index].char) return;

    const nextIndex = decodableIndexes.find((candidate) => (
      candidate > index && nextAnswers[candidate] !== decoder.tokens[candidate].char
    ));

    if (nextIndex !== undefined) {
      window.requestAnimationFrame(() => inputRefs.current[nextIndex]?.focus());
    } else {
      event.target.blur();
    }
  };

  return (
    <main className="hart-page">
      <div className="hart-page-header">
        <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}>
          {t('common.back')}
        </button>
        <div>
          <h1>{t('hart.title')}</h1>
          <p>{t('hart.subtitle')}</p>
        </div>
      </div>

      <section className="hart-training-card">
        <div className="hart-toolbar">
          <label className="hart-scale-control">
            <span>{t('hart.fontSize')}</span>
            <input
              type="range"
              min="0.65"
              max="1.45"
              step="0.05"
              value={scale}
              onChange={(event) => setScale(clampHartScale(Number(event.target.value)))}
            />
            <output>{Math.round(scale * 100)}%</output>
          </label>

          <div className="hart-toolbar-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setQrOpen(true)}>
              {t('hart.openQr')}
            </button>
            <button className="btn btn-primary" type="button" onClick={resetChart}>
              {t('hart.reset')}
            </button>
          </div>
        </div>

        <HartChartGrid
          cells={chart}
          scale={scale}
          hintsEnabled={showHints}
          hintedToken={activeTokenIndex === null ? undefined : decoder.tokens[activeTokenIndex]}
        />
      </section>

      <section className="hart-decoder-card">
        <label className="hart-switch-row">
          <span>
            <strong>{t('hart.decoder')}</strong>
            <small>{t('hart.decoderSummary')}</small>
          </span>
          <input
            type="checkbox"
            checked={decoderOpen}
            onChange={(event) => setDecoderOpen(event.target.checked)}
          />
        </label>

        {decoderOpen && (
          <div className="hart-decoder-content">
            <label className="hart-hints-toggle">
              <input
                type="checkbox"
                checked={showHints}
                onChange={(event) => setShowHints(event.target.checked)}
              />
              {t('hart.showHints')}
            </label>

            <div
              className={`hart-code-output ${complete ? 'hart-code-output-complete' : ''}`}
              aria-label={t('hart.decoder')}
            >
              {decoder.tokens.map((token, index) => {
                if (!token.coordinate) {
                  return (
                    <span className="hart-code-static" key={`${index}-${token.char}`}>
                      {token.char === ' ' ? '\u00A0' : token.char}
                    </span>
                  );
                }

                const isCorrect = answers[index] === token.char;
                return (
                  <input
                    key={`${index}-${token.char}`}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    className={`hart-code-input ${isCorrect ? 'is-correct' : ''}`}
                    value={answers[index] ?? ''}
                    placeholder={`[${token.coordinate.row},${token.coordinate.col}]`}
                    aria-label={`${t('hart.coordinate')} ${token.coordinate.row}, ${token.coordinate.col}`}
                    maxLength={1}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => handleAnswer(index, event)}
                    onFocus={() => setActiveTokenIndex(index)}
                    onBlur={() => setActiveTokenIndex((current) => current === index ? null : current)}
                    onMouseEnter={() => setActiveTokenIndex(index)}
                    onMouseLeave={() => {
                      if (document.activeElement !== inputRefs.current[index]) {
                        setActiveTokenIndex(null);
                      }
                    }}
                  />
                );
              })}
            </div>

            <p className="hart-decoder-status" aria-live="polite">
              {complete ? `${t('hart.decoderComplete')} ${decoder.phrase}` : t('hart.decoderPrompt')}
            </p>
          </div>
        )}
      </section>

      <section className="hart-instructions-card">
        <h2>{t('hart.instructionsTitle')}</h2>
        <ol>
          <li>{t('hart.instructions.1')}</li>
          <li>{t('hart.instructions.2')}</li>
          <li>{t('hart.instructions.3')}</li>
          <li>{t('hart.instructions.4')}</li>
          <li>{t('hart.instructions.5')}</li>
          <li>{t('hart.instructions.6')}</li>
          <li>{t('hart.instructions.7')}</li>
        </ol>
        <p className="hart-instructions-note"><strong>{t('hart.rememberLabel')}</strong> {t('hart.remember')}</p>

        <h3>{t('hart.decoderInstructionsTitle')}</h3>
        <ol>
          <li>{t('hart.decoderInstructions.1')}</li>
          <li>{t('hart.decoderInstructions.2')}</li>
          <li>{t('hart.decoderInstructions.3')}</li>
          <li>{t('hart.decoderInstructions.4')}</li>
        </ol>
      </section>

      {qrOpen && (
        <div className="hart-qr-overlay" role="presentation" onClick={() => setQrOpen(false)}>
          <div
            className="hart-qr-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hart-qr-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="hart-qr-title">{t('hart.qrTitle')}</h2>
            <p>{t('hart.qrDescription')}</p>
            {qrDataUrl ? <img src={qrDataUrl} alt={t('hart.qrAlt')} /> : <div className="hart-qr-loading" />}
            <a href={shareUrl} target="_blank" rel="noreferrer">{t('hart.openDisplay')}</a>
            <button className="btn btn-primary" type="button" onClick={() => setQrOpen(false)}>
              {t('hart.close')}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export function HartChartDisplayPage() {
  const [searchParams] = useSearchParams();
  const seed = useMemo(() => parseHartSeed(searchParams.get('seed')), [searchParams]);
  const scale = clampHartScale(Number(searchParams.get('scale') ?? '1'));
  const chart = useMemo(() => createHartChart(seed), [seed]);

  useEffect(() => {
    const enterFullscreen = () => {
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen?.().catch(() => undefined);
      }
      window.removeEventListener('pointerdown', enterFullscreen);
    };

    window.addEventListener('pointerdown', enterFullscreen, { once: true });
    return () => window.removeEventListener('pointerdown', enterFullscreen);
  }, []);

  return (
    <main className="hart-display-page">
      <HartChartGrid cells={chart} scale={scale} chartOnly />
    </main>
  );
}
