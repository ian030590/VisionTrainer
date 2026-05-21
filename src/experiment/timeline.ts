/**
 * jsPsych Timeline Builder.
 * Assembles the trial timeline based on the selected training module.
 */
import PixiMovingCardPlugin from './plugins/pixi-moving-card';
import { getSetting } from '../utils/settings';
import { generateRandomLetters } from '../utils/mathUtils';

/**
 * Build a jsPsych timeline for the given module.
 * Each trial = one round of the training game.
 */
export function buildTimeline(
  moduleId: string,
  overrides?: { difficulty?: string; totalRounds?: number },
): object[] {
  switch (moduleId) {
    case 'moving-card':
      return buildMovingCardTimeline(overrides);
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
