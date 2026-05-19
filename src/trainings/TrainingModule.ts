/**
 * Training Module plugin interface.
 * Future training modules must implement this interface to integrate seamlessly.
 * Inspired by FrACT10's gTestRegistry pattern.
 */
import type { Scene } from '../core/SceneManager';

/** Metadata describing a training module */
export interface TrainingModuleMeta {
  /** Unique ID for this module */
  id: string;
  /** Display name (Chinese) */
  name: string;
  /** Short description */
  description: string;
  /** Icon emoji or path */
  icon: string;
  /** Sort order in the training list */
  order: number;
}

/** Interface that all training modules must implement */
export interface TrainingModule {
  /** Module metadata */
  readonly meta: TrainingModuleMeta;
  /** Create and return the Scene for this training */
  createScene(): Scene;
}
