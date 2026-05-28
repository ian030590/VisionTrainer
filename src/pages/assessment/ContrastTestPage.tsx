import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { initJsPsych } from 'jspsych';
import type { JsPsych } from 'jspsych';
import { pixiAppManager } from '../../utils/pixiPool';
import PixiContrastSensitivityPlugin from '../../experiment/plugins/pixi-contrast-sensitivity';
import { BestPEST } from '../../assessment/bestPest';
import { getSetting } from '../../utils/settings';

// Ensure plugin is referenced
void PixiContrastSensitivityPlugin;

export function ContrastTestPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const jsPsychRef = useRef<JsPsych | null>(null);
  
  const [phase, setPhase] = useState<'running' | 'results'>('running');
  const [resultLogCSW, setResultLogCSW] = useState<number>(0);

  useEffect(() => {
    if (phase !== 'running') return;
    if (!containerRef.current) return;
    if (jsPsychRef.current) return;

    const setup = async () => {
      await pixiAppManager.warmUp();
      
      const jsPsych = initJsPsych({
        display_element: containerRef.current!,
        on_finish: () => {
          setPhase('results');
        }
      });
      jsPsychRef.current = jsPsych;

      const pest = new BestPEST(8);
      const totalTrials = 18;
      let currentTrial = 0;
      let appliedStim = 0.5;

      const getBackColor = () => {
        const gamma = getSetting('gammaValue') || 2.2;
        const c = Math.round(Math.pow(0.5, 1 / gamma) * 255);
        const hex = c.toString(16).padStart(2, '0');
        return `#${hex}${hex}${hex}`;
      };

      const getForeColor = () => {
        appliedStim = pest.nextStim2apply();
        const logCSWMaximal = 2.0; // Max logCS
        const logCSW = logCSWMaximal - logCSWMaximal * appliedStim;
        const weber = Math.pow(10, -logCSW);
        const lFore = 0.5 * (1 - weber); // Darker optotype
        const gamma = getSetting('gammaValue') || 2.2;
        const c = Math.round(Math.pow(lFore, 1 / gamma) * 255);
        const hex = c.toString(16).padStart(2, '0');
        return `#${hex}${hex}${hex}`;
      };

      const trialNode = {
        type: PixiContrastSensitivityPlugin,
        optotype: 'landolt',
        direction: () => Math.floor(Math.random() * 8),
        stroke_px: 20, // fixed large size to measure contrast purely
        fore_color: getForeColor,
        back_color: getBackColor,
        on_finish: (data: any) => {
          pest.enterTrialOutcome(appliedStim, data.correct);
          currentTrial++;
        }
      };

      const loopNode = {
        timeline: [trialNode],
        loop_function: () => {
          return currentTrial < totalTrials;
        }
      };

      jsPsych.run([loopNode]).then(() => {
         const finalStim = pest.nextStim2apply();
         const logCSWMaximal = 2.0;
         const finalLogCSW = logCSWMaximal - logCSWMaximal * finalStim;
         setResultLogCSW(finalLogCSW);
         pixiAppManager.destroy(); // clean up pixi
      });
    };

    setup();

    return () => {
      // cleanup on unmount
      if (jsPsychRef.current && phase === 'running') {
        pixiAppManager.destroy();
      }
    };
  }, [phase]);

  if (phase === 'results') {
     return (
       <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
         <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{t('assess.contrast.resultsTitle') || 'Contrast Sensitivity Results'}</h2>
         <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>logCS (Weber): {resultLogCSW.toFixed(2)}</p>
         <button 
           onClick={() => navigate('/assessment')}
           style={{ padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer' }}
         >
           {t('common.back') || 'Back'}
         </button>
       </div>
     );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#808080' }}>
       <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
