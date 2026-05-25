import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initJsPsych } from 'jspsych';
import { runFusionTimeline } from './timeline';
import { FusionResults } from './FusionResults';
import { useT } from '../i18n';

export function BinocularFusionPage() {
  const navigate = useNavigate();
  const { t } = useT();
  const jsPsychRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [resultsData, setResultsData] = useState<any[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize jsPsych
    const jsPsych = initJsPsych({
      display_element: containerRef.current,
      on_finish: () => {
        setIsFinished(true);
        // After finish, get the CSV data
        const data = jsPsych.data.get().csv();
        setResultsData(jsPsych.data.get().values());
      },
    });

    jsPsychRef.current = jsPsych;

    // Run the timeline
    runFusionTimeline(jsPsych, t).catch((err) => {
      console.error('Failed to run fusion timeline:', err);
    });

    return () => {
      // Cleanup if necessary (jsPsych doesn't have a strict destroy method, 
      // but clearing the DOM might be needed)
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  if (isFinished) {
    return <FusionResults data={resultsData} onBack={() => navigate('/')} />;
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      />
    </div>
  );
}
