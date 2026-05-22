/**
 * jsPsych Timeline Builder.
 * Assembles the trial timeline based on the selected training module.
 */
import PixiMovingCardPlugin from './plugins/pixi-moving-card';
import PixiOculomotorTrainingPlugin from './plugins/pixi-oculomotor-training';
import { getSetting } from '../utils/settings';
import { generateRandomLetters } from '../utils/mathUtils';
import { pixelFromDegree, pixelFromMillimeter } from '../utils/spatialUtils';
import type { OculomotorMode, OculomotorPattern } from '../oculomotor/types';

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
    };
  },
): object[] {
  switch (moduleId) {
    case 'moving-card':
      return buildMovingCardTimeline(overrides);
    case 'oculomotor-training':
      return buildOculomotorTimeline(overrides);
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
    };
  },
): object[] {
  const mode = overrides?.oculomotor?.mode ?? getSetting('oculomotorMode');
  const pattern = overrides?.oculomotor?.pattern ?? getSetting('oculomotorPattern');
  const durationSec = overrides?.oculomotor?.durationSec ?? getSetting('oculomotorDurationSec');
  const speedDegPerSec = overrides?.oculomotor?.speedDegPerSec ?? getSetting('oculomotorSpeedDegPerSec');
  const targetSizeMm = overrides?.oculomotor?.targetSizeMm ?? getSetting('oculomotorTargetSizeMm');
  const distractorCount = overrides?.oculomotor?.distractorCount ?? getSetting('oculomotorDistractorCount');

  return [
    {
      type: PixiOculomotorTrainingPlugin,
      mode,
      pattern,
      duration_ms: Math.round(durationSec * 1000),
      speed_px_per_sec: pixelFromDegree(speedDegPerSec),
      target_radius_px: Math.max(6, pixelFromMillimeter(targetSizeMm) / 2),
      distractor_count: distractorCount,
      round_number: 1,
      total_rounds: 1,
    },
  ];
}
