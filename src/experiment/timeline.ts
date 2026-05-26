/**
 * jsPsych Timeline Builder.
 * Assembles the trial timeline based on the selected training module.
 */
import PixiMovingCardPlugin from './plugins/pixi-moving-card';
import PixiOculomotorTrainingPlugin from './plugins/pixi-oculomotor-training';
import PixiGaborPatchPlugin from './plugins/pixi-gabor-patch';
import WebgazerInitCameraPlugin from '@jspsych/plugin-webgazer-init-camera';
import WebgazerCalibratePlugin from '@jspsych/plugin-webgazer-calibrate';
import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import PixiReadingTrainingPlugin from './plugins/pixi-reading-training';
import { getSetting } from '../utils/settings';
import { generateRandomLetters } from '../utils/mathUtils';
import { pixelFromDegree, pixelFromMillimeter } from '../utils/spatialUtils';
import type { OculomotorMode, OculomotorPattern, OculomotorTargetShape } from '../oculomotor/types';
import type { ReadingStory } from '../reading/types';

/**
 * Build a jsPsych timeline for the given module.
 * Each trial = one round of the training game.
 */
export function buildTimeline(
  moduleId: string,
  overrides?: {
    difficulty?: string;
    totalRounds?: number;
    oculomotor?: {
      mode?: OculomotorMode;
      pattern?: OculomotorPattern;
      durationSec?: number;
      speedDegPerSec?: number;
      targetSizeMm?: number;
      distractorCount?: number;
      targetColor?: string;
      backgroundColor?: string;
      targetShape?: OculomotorTargetShape;
      customTargetImage?: string;
      opacity?: number;
      backgroundImage?: string;
      audio?: string;
      bounceJitter?: number;
    };
    gabor?: {
      durationSec?: number;
      maxSpots?: number;
    };
    reading?: {
      wps?: number;
      crowding?: number;
      contrast?: number;
      story?: ReadingStory;
    };
  },
): object[] {
  switch (moduleId) {
    case 'moving-card':
      return buildMovingCardTimeline(overrides);
    case 'oculomotor-training':
      return buildOculomotorTimeline(overrides);
    case 'gabor-patch':
      return buildGaborPatchTimeline(overrides);
    case 'reading-training':
      return buildReadingTimeline(overrides);
    default:
      console.warn(`Unknown module: ${moduleId}, falling back to moving-card`);
      return buildMovingCardTimeline(overrides);
  }
}

function buildMovingCardTimeline(
  overrides?: { difficulty?: string; totalRounds?: number },
): object[] {
  const totalRounds = overrides?.totalRounds ?? getSetting('totalRounds');
  const difficulty = overrides?.difficulty ?? getSetting('difficulty');
  const optionCount = getSetting('optionCount');
  const moveInterval = getSetting('optionMoveIntervalMs');
  const targetSizeMm = getSetting('targetPhysicalSizeMm');
  const optionSizeMm = getSetting('optionPhysicalSizeMm');

  const timeline: object[] = [];

  for (let i = 0; i < totalRounds; i++) {
    timeline.push({
      type: PixiMovingCardPlugin,
      target_letters: generateRandomLetters(2),
      option_count: optionCount,
      difficulty: difficulty,
      move_interval_ms: moveInterval,
      target_size_mm: targetSizeMm,
      option_size_mm: optionSizeMm,
      round_number: i + 1,
      total_rounds: totalRounds,
    });
  }

  return timeline;
}

function buildOculomotorTimeline(
  overrides?: {
    oculomotor?: {
      mode?: OculomotorMode;
      pattern?: OculomotorPattern;
      durationSec?: number;
      speedDegPerSec?: number;
      targetSizeMm?: number;
      distractorCount?: number;
      targetColor?: string;
      backgroundColor?: string;
      targetShape?: OculomotorTargetShape;
      customTargetImage?: string;
      opacity?: number;
      backgroundImage?: string;
      audio?: string;
      bounceJitter?: number;
    };
  },
): object[] {
  const mode = overrides?.oculomotor?.mode ?? getSetting('oculomotorMode');
  const pattern = overrides?.oculomotor?.pattern ?? getSetting('oculomotorPattern');
  const durationSec = overrides?.oculomotor?.durationSec ?? getSetting('oculomotorDurationSec');
  const speedDegPerSec = overrides?.oculomotor?.speedDegPerSec ?? getSetting('oculomotorSpeedDegPerSec');
  const targetSizeMm = overrides?.oculomotor?.targetSizeMm ?? getSetting('oculomotorTargetSizeMm');
  const distractorCount = overrides?.oculomotor?.distractorCount ?? getSetting('oculomotorDistractorCount');
  const targetColor = overrides?.oculomotor?.targetColor ?? getSetting('oculomotorTargetColor');
  const backgroundColor = overrides?.oculomotor?.backgroundColor ?? getSetting('oculomotorBackgroundColor');
  const targetShape = overrides?.oculomotor?.targetShape ?? getSetting('oculomotorTargetShape');
  const customTargetImage = overrides?.oculomotor?.customTargetImage ?? getSetting('oculomotorCustomTargetImage');
  const opacity = overrides?.oculomotor?.opacity ?? getSetting('oculomotorTargetOpacity');
  const backgroundImage = overrides?.oculomotor?.backgroundImage ?? getSetting('oculomotorBackgroundImage');
  const audio = overrides?.oculomotor?.audio ?? getSetting('oculomotorAudio');
  const bounceJitter = overrides?.oculomotor?.bounceJitter ?? getSetting('oculomotorBounceJitter');
  const enableWebGazer = getSetting('oculomotorEnableWebgazer');

  const timeline: object[] = [];

  if (enableWebGazer) {
    timeline.push({
      type: WebgazerInitCameraPlugin,
    });
    
    if (!getSetting('webGazerCalibrationAt')) {
      timeline.push({
        type: WebgazerCalibratePlugin,
        calibration_points: [
          [10, 10], [10, 50], [10, 90],
          [50, 10], [50, 50], [50, 90],
          [90, 10], [90, 50], [90, 90],
        ],
        repetitions_per_point: 2,
        randomize_calibration_order: true,
      });
    }
  }

  timeline.push({
      type: PixiOculomotorTrainingPlugin,
      mode,
      pattern,
      duration_ms: Math.round(durationSec * 1000),
      speed_px_per_sec: pixelFromDegree(speedDegPerSec),
      target_radius_px: Math.max(6, pixelFromMillimeter(targetSizeMm) / 2),
      distractor_count: distractorCount,
      target_color: targetColor,
      background_color: backgroundColor,
      target_shape: targetShape,
      custom_target_image: customTargetImage,
      opacity,
      background_image: backgroundImage,
      audio,
      bounce_jitter: bounceJitter,
      enable_webgazer: enableWebGazer,
      round_number: 1,
      total_rounds: 1,
    }
  );

  return timeline;
}

function buildGaborPatchTimeline(
  overrides?: {
    difficulty?: string;
    gabor?: {
      durationSec?: number;
      maxSpots?: number;
    };
  },
): object[] {
  const durationSec = overrides?.gabor?.durationSec ?? getSetting('oculomotorDurationSec'); // fallback to general duration
  const maxSpots = overrides?.gabor?.maxSpots ?? 10;
  const difficulty = overrides?.difficulty ?? getSetting('difficulty');

  return [
    {
      type: PixiGaborPatchPlugin,
      duration_ms: Math.round(durationSec * 1000),
      max_spots: maxSpots,
      difficulty: difficulty,
      // Default parameters will be used for min_size, max_size, etc.
    },
  ];
}

function buildReadingTimeline(
  overrides?: {
    reading?: {
      wps?: number;
      crowding?: number;
      contrast?: number;
      story?: ReadingStory;
    };
  }
): object[] {
  const wps = overrides?.reading?.wps ?? getSetting('readingWPS');
  const crowding = overrides?.reading?.crowding ?? getSetting('readingCrowding');
  const contrast = overrides?.reading?.contrast ?? getSetting('readingContrast');
  const story = overrides?.reading?.story;

  const timeline: object[] = [];

  if (story && story.content_array) {
    timeline.push({
      type: PixiReadingTrainingPlugin,
      content_array: story.content_array,
      wps: wps,
      crowding: crowding,
      contrast: contrast,
    });
    
    // Pick 10 random questions or all if less than 10
    const questions = [...(story.questions || [])];
    questions.sort(() => Math.random() - 0.5);
    const selectedQuestions = questions.slice(0, 10);
    
    for (const q of selectedQuestions) {
      timeline.push({
        type: HtmlButtonResponsePlugin,
        stimulus: `<div style="font-size:24px; font-weight:600; margin-bottom: 24px;">${q.question}</div>`,
        choices: q.options,
        data: {
          target: q.question,
          correct_index: q.correct_index,
        },
        on_finish: (data: any) => {
          data.correct = data.response === data.correct_index;
          data.response_text = q.options[data.response];
        }
      });
    }
  } else {
    console.error('No story data provided to reading timeline');
  }

  return timeline;
}
