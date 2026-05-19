/**
 * Peripheral Vision Training Module.
 * Registers with TrainingRegistry so it appears in the training list.
 */
import type { TrainingModule, TrainingModuleMeta } from './TrainingModule';
import type { Scene } from '../core/SceneManager';
import { PeripheralVisionScene } from '../scenes/PeripheralVisionScene';

export class PeripheralVisionModule implements TrainingModule {
  readonly meta: TrainingModuleMeta = {
    id: 'peripheral-vision',
    name: '周邊視覺訓練',
    description: '訓練注視中心點時快速辨識周邊文字的能力，字母選項會動態移動增加難度。',
    icon: '👁️',
    order: 1,
  };

  private goBackFn: (() => void) | null = null;

  /** Provide a callback to navigate back to the training list */
  setGoBack(fn: () => void): void {
    this.goBackFn = fn;
  }

  createScene(): Scene {
    return new PeripheralVisionScene(() => {
      if (this.goBackFn) this.goBackFn();
    });
  }
}
