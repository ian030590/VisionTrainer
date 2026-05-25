import FusionCalibrationPlugin from './plugin-fusion-calibration';
import VergenceTrainingPlugin from './plugin-vergence-training';

export const runFusionTimeline = async (jsPsych: any, t: any) => {
  const timeline: any[] = [];

  // 1. Calibration Phase
  const calibrationTrial = {
    type: FusionCalibrationPlugin,
    shape_size: 150,
    instruction_html: t('fusion.calib.inst'),
  };
  timeline.push(calibrationTrial);

  // 2. Vergence Training Phase
  // We use a loop function or timeline variables to do multiple trials
  const numTrials = 5;

  for (let i = 0; i < numTrials; i++) {
    timeline.push({
      type: VergenceTrainingPlugin,
      shape_size: 150,
      separation_speed: 15 + i * 5, // speed increases with trials
      max_separation: 200,
      instruction_html: t('fusion.train.inst'),
      question_html: `
        <h2>${t('fusion.train.q.title')}</h2>
        <p>${t('fusion.train.q.l')}</p>
        <p>${t('fusion.train.q.r')}</p>
        <p>${t('fusion.train.q.both')}</p>
      `,
      // Pass the offsets from calibration to each training trial
      base_offsetX: () => {
        const lastCalib = jsPsych.data.get().filter({ trial_type: 'fusion-calibration' }).last(1).values()[0];
        return lastCalib ? lastCalib.offsetX : 0;
      },
      base_offsetY: () => {
        const lastCalib = jsPsych.data.get().filter({ trial_type: 'fusion-calibration' }).last(1).values()[0];
        return lastCalib ? lastCalib.offsetY : 0;
      },
    });
  }

  await jsPsych.run(timeline);
};

