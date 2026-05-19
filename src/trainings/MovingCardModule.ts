/**
 * Moving Card Training Module.
 * Registers with TrainingRegistry so it appears in the training list.
 */
import type { TrainingModule, TrainingModuleMeta } from './TrainingModule';
import type { Scene } from '../core/SceneManager';
import { MovingCardScene } from '../scenes/MovingCardScene';

export class MovingCardModule implements TrainingModule {
  readonly meta: TrainingModuleMeta = {
    id: 'moving-card',
    name: '移動卡片訓練',
    description: '訓練注視中心點時快速辨識移動卡片文字的能力，字母選項會動態移動增加難度。',
    icon: 'eye',
    order: 1,
  };

  private goBackFn: (() => void) | null = null;

  /** Provide a callback to navigate back to the training list */
  setGoBack(fn: () => void): void {
    this.goBackFn = fn;
  }

  createScene(): Scene {
    return new MovingCardScene(() => {
      if (this.goBackFn) this.goBackFn();
    });
  }
}
