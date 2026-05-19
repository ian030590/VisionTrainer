/**
 * Reusable PixiJS Button component with hover/press animations.
 * Inspired by FrACT10's buttonCenteredAtX:y:size:title: pattern.
 */
import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js';
import { Theme } from './Theme';

export interface ButtonOptions {
  label: string;
  width?: number;
  height?: number;
  fontSize?: number;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick?: () => void;
}

export class Button extends Container {
  private bg: Graphics;
  private labelText: Text;
  private opts: Required<ButtonOptions>;
  private _hovered = false;
  private _pressed = false;

  constructor(options: ButtonOptions) {
    super();
    this.opts = {
      label: options.label,
      width: options.width ?? 200,
      height: options.height ?? 48,
      fontSize: options.fontSize ?? Theme.fontSizeM,
      variant: options.variant ?? 'primary',
      onClick: options.onClick ?? (() => {}),
    };

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.labelText = new Text({
      text: this.opts.label,
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: this.opts.fontSize,
        fontWeight: '600',
        fill: this.getTextColor(),
      },
    });
    this.labelText.anchor.set(0.5);
    this.labelText.x = this.opts.width / 2;
    this.labelText.y = this.opts.height / 2;
    this.addChild(this.labelText);

    this.draw();

    // interaction
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', this.onHoverIn, this);
    this.on('pointerout', this.onHoverOut, this);
    this.on('pointerdown', this.onPressDown, this);
    this.on('pointerup', this.onPressUp, this);
    this.on('pointerupoutside', this.onPressUp, this);
    this.on('pointertap', (_e: FederatedPointerEvent) => this.opts.onClick());
  }

  private getTextColor(): number {
    switch (this.opts.variant) {
      case 'secondary': return Theme.accent;
      case 'ghost': return Theme.textSecondary;
      case 'danger': return Theme.textPrimary;
      default: return Theme.textPrimary;
    }
  }

  private getBgColor(): number {
    if (this._pressed) {
      switch (this.opts.variant) {
        case 'secondary': return 0x1A3A5C;
        case 'ghost': return Theme.bgCard;
        case 'danger': return 0x8B1A1A;
        default: return Theme.accentDark;
      }
    }
    if (this._hovered) {
      switch (this.opts.variant) {
        case 'secondary': return 0x152A44;
        case 'ghost': return Theme.bgCard;
        case 'danger': return 0xA32020;
        default: return Theme.accentHover;
      }
    }
    switch (this.opts.variant) {
      case 'secondary': return Theme.bgPanel;
      case 'ghost': return 0x00000000;
      case 'danger': return Theme.error;
      default: return Theme.accent;
    }
  }

  private getBorderColor(): number {
    if (this.opts.variant === 'secondary') {
      return this._hovered ? Theme.accentHover : Theme.accent;
    }
    return 0x00000000;
  }

  private draw(): void {
    this.bg.clear();
    const bgColor = this.getBgColor();
    const borderColor = this.getBorderColor();

    if (this.opts.variant === 'secondary') {
      this.bg.roundRect(0, 0, this.opts.width, this.opts.height, Theme.radiusM);
      this.bg.fill({ color: bgColor });
      this.bg.roundRect(0, 0, this.opts.width, this.opts.height, Theme.radiusM);
      this.bg.stroke({ color: borderColor, width: 2 });
    } else if (this.opts.variant === 'ghost') {
      this.bg.roundRect(0, 0, this.opts.width, this.opts.height, Theme.radiusM);
      this.bg.fill({ color: bgColor, alpha: this._hovered ? 0.5 : 0 });
    } else {
      this.bg.roundRect(0, 0, this.opts.width, this.opts.height, Theme.radiusM);
      this.bg.fill({ color: bgColor });
    }

    this.labelText.style.fill = this.getTextColor();
  }

  private onHoverIn(): void { this._hovered = true; this.draw(); this.scale.set(1.02); }
  private onHoverOut(): void { this._hovered = false; this._pressed = false; this.draw(); this.scale.set(1); }
  private onPressDown(): void { this._pressed = true; this.draw(); this.scale.set(0.97); }
  private onPressUp(): void { this._pressed = false; this.draw(); this.scale.set(this._hovered ? 1.02 : 1); }

  /** Update the label text */
  setLabel(text: string): void {
    this.labelText.text = text;
  }
}
