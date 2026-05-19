/**
 * Reusable PixiJS Panel (rounded rectangle card with optional title).
 * Similar to FrACT10's CPPanel.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { Theme } from './Theme';

export interface PanelOptions {
  width: number;
  height: number;
  title?: string;
  padding?: number;
}

export class Panel extends Container {
  private bg: Graphics;
  private titleText: Text | null = null;
  readonly contentContainer: Container;
  private opts: Required<PanelOptions>;

  constructor(options: PanelOptions) {
    super();
    this.opts = {
      width: options.width,
      height: options.height,
      title: options.title ?? '',
      padding: options.padding ?? Theme.paddingL,
    };

    // background
    this.bg = new Graphics();
    this.drawBg();
    this.addChild(this.bg);

    // title
    if (this.opts.title) {
      this.titleText = new Text({
        text: this.opts.title,
        style: {
          fontFamily: Theme.fontFamily,
          fontSize: Theme.fontSizeL,
          fontWeight: '700',
          fill: Theme.textPrimary,
        },
      });
      this.titleText.x = this.opts.padding;
      this.titleText.y = this.opts.padding;
      this.addChild(this.titleText);
    }

    // content area
    this.contentContainer = new Container();
    this.contentContainer.x = this.opts.padding;
    this.contentContainer.y = this.titleText
      ? this.opts.padding + this.titleText.height + Theme.paddingM
      : this.opts.padding;
    this.addChild(this.contentContainer);
  }

  private drawBg(): void {
    this.bg.clear();
    // shadow
    this.bg.roundRect(3, 3, this.opts.width, this.opts.height, Theme.radiusL);
    this.bg.fill({ color: 0x000000, alpha: 0.3 });
    // main bg
    this.bg.roundRect(0, 0, this.opts.width, this.opts.height, Theme.radiusL);
    this.bg.fill({ color: Theme.bgPanel });
    // border
    this.bg.roundRect(0, 0, this.opts.width, this.opts.height, Theme.radiusL);
    this.bg.stroke({ color: Theme.border, width: 1 });
  }

  /** Get usable content width */
  get contentWidth(): number {
    return this.opts.width - this.opts.padding * 2;
  }

  /** Get usable content height */
  get contentHeight(): number {
    const titleOffset = this.titleText ? this.titleText.height + Theme.paddingM : 0;
    return this.opts.height - this.opts.padding * 2 - titleOffset;
  }
}
