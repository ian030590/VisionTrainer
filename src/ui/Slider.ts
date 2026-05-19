/**
 * PixiJS Slider component for calibration adjustments.
 */
import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import { Theme } from './Theme';
import { clamp } from '../utils/MathUtils';

export interface SliderOptions {
  width: number;
  min: number;
  max: number;
  value: number;
  step?: number;
  onChange?: (value: number) => void;
}

export class Slider extends Container {
  private track: Graphics;
  private fill: Graphics;
  private thumb: Graphics;
  private opts: Required<SliderOptions>;
  private _value: number;
  private dragging = false;

  constructor(options: SliderOptions) {
    super();
    this.opts = {
      width: options.width,
      min: options.min,
      max: options.max,
      value: options.value,
      step: options.step ?? 1,
      onChange: options.onChange ?? (() => {}),
    };
    this._value = options.value;

    const trackH = 6;
    const thumbR = 12;

    // track background
    this.track = new Graphics();
    this.track.roundRect(0, -trackH / 2, this.opts.width, trackH, 3);
    this.track.fill({ color: Theme.bgCard });
    this.track.y = thumbR;
    this.addChild(this.track);

    // filled portion
    this.fill = new Graphics();
    this.fill.y = thumbR;
    this.addChild(this.fill);

    // thumb
    this.thumb = new Graphics();
    this.thumb.circle(0, 0, thumbR);
    this.thumb.fill({ color: Theme.accent });
    this.thumb.circle(0, 0, thumbR);
    this.thumb.stroke({ color: Theme.bgPanel, width: 3 });
    this.thumb.y = thumbR;
    this.addChild(this.thumb);

    this.updateVisual();

    // Make entire slider interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = { contains: (x: number, y: number) => x >= -thumbR && x <= this.opts.width + thumbR && y >= -thumbR && y <= thumbR * 3 };

    this.on('pointerdown', this.onDragStart, this);
    this.on('pointermove', this.onDragMove, this);
    this.on('pointerup', this.onDragEnd, this);
    this.on('pointerupoutside', this.onDragEnd, this);
  }

  get value(): number { return this._value; }
  set value(v: number) {
    this._value = clamp(v, this.opts.min, this.opts.max);
    this.updateVisual();
  }

  private fraction(): number {
    return (this._value - this.opts.min) / (this.opts.max - this.opts.min);
  }

  private updateVisual(): void {
    const f = this.fraction();
    const px = f * this.opts.width;
    const trackH = 6;
    // fill
    this.fill.clear();
    this.fill.roundRect(0, -trackH / 2, px, trackH, 3);
    this.fill.fill({ color: Theme.accent });
    // thumb
    this.thumb.x = px;
  }

  private valueFromX(localX: number): number {
    const f = clamp(localX / this.opts.width, 0, 1);
    const raw = this.opts.min + f * (this.opts.max - this.opts.min);
    // snap to step
    return Math.round(raw / this.opts.step) * this.opts.step;
  }

  private onDragStart(e: FederatedPointerEvent): void {
    this.dragging = true;
    const local = this.toLocal(e.global);
    this._value = this.valueFromX(local.x);
    this.updateVisual();
    this.opts.onChange(this._value);
  }

  private onDragMove(e: FederatedPointerEvent): void {
    if (!this.dragging) return;
    const local = this.toLocal(e.global);
    this._value = this.valueFromX(local.x);
    this.updateVisual();
    this.opts.onChange(this._value);
  }

  private onDragEnd(): void {
    this.dragging = false;
  }
}
