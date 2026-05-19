/**
 * Main Menu Scene — the landing page of ReadingTrainer.
 * Dark scientific UI with animated cards.
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Scene } from '../core/SceneManager';
import { Theme } from '../ui/Theme';
import { APP_VERSION } from '../core/Globals';
import { isCalibrated } from '../core/Settings';
import { SoundManager } from '../core/SoundManager';
import { easeOutCubic } from '../utils/MathUtils';
import { drawWarning, drawDumbbell, drawGear, drawArrowRight } from '../ui/Icons';

export class MainMenuScene implements Scene {
  readonly container = new Container();
  private sceneManager: { goTo(name: string): void };
  
  private bg = new Graphics();
  private grid = new Graphics();
  private title = new Text();
  private subtitle = new Text();
  private statusDot = new Graphics();
  private statusText = new Text();
  private statusIcon: Graphics | null = null;
  private version = new Text();
  private glow = new Graphics();
  private cardContainer = new Container();
  private cards: Container[] = [];
  
  private animProgress = 0;

  constructor(sceneManager: { goTo(name: string): void }) {
    this.sceneManager = sceneManager;
    
    // Add all children
    this.container.addChild(this.bg);
    this.container.addChild(this.grid);
    this.container.addChildAt(this.glow, 0); // behind grid
    this.container.addChild(this.title);
    this.container.addChild(this.subtitle);
    this.container.addChild(this.statusDot);
    this.container.addChild(this.statusText);
    this.container.addChild(this.cardContainer);
    this.container.addChild(this.version);
    
    this.initElements();
  }

  private initElements(): void {
    this.title.text = 'ReadingTrainer';
    this.title.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSize3XL, fontWeight: '700', fill: Theme.textPrimary, letterSpacing: 2 };
    this.title.anchor.set(0.5, 0);

    this.subtitle.text = '視覺與閱讀能力訓練系統';
    this.subtitle.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fill: Theme.textSecondary };
    this.subtitle.anchor.set(0.5, 0);

    this.statusDot.circle(0, 0, 5);
    this.statusText.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeS };

    this.version.text = `v${APP_VERSION}  •  TypeScript + PixiJS`;
    this.version.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeXS, fill: Theme.textMuted };
    this.version.anchor.set(0.5, 1);
  }

  onEnter(): void {
    this.animProgress = 0;
    const calibrated = isCalibrated();
    this.statusDot.fill({ color: calibrated ? Theme.success : Theme.warning });
    this.statusText.text = calibrated ? '已完成螢幕校正' : '尚未校正螢幕';
    this.statusText.style.fill = calibrated ? Theme.success : Theme.warning;
    
    // Add warning icon if not calibrated
    if (this.statusIcon) { this.container.removeChild(this.statusIcon); this.statusIcon = null; }
    if (!calibrated) {
      this.statusIcon = drawWarning(14, Theme.warning);
      this.container.addChild(this.statusIcon);
    }

    this.cardContainer.removeChildren();
    this.cards = [];
    const cardData = [
      { title: '訓練清單', desc: '選擇並進入不同的閱讀與視覺訓練項目', target: 'trainingList', iconFn: () => drawDumbbell(28, Theme.accent) },
      { title: '設定與校正', desc: '調整觀看距離、進行螢幕尺寸校正', target: 'settings', iconFn: () => drawGear(28, Theme.accent) },
    ];
    
    cardData.forEach((data, i) => {
      const card = this.createCard(data.title, data.desc, 320, 180, () => {
        SoundManager.init();
        this.sceneManager.goTo(data.target);
      }, data.iconFn());
      card.x = i * 360; // 320 width + 40 gap
      card.y = 40; // anim start offset
      card.alpha = 0;
      this.cards.push(card);
      this.cardContainer.addChild(card);
    });
  }

  onResize(width: number, height: number): void {
    // Background & Grid
    this.bg.clear().rect(0, 0, width, height).fill({ color: Theme.bg });
    this.grid.clear();
    for (let x = 0; x < width; x += 40) { this.grid.moveTo(x, 0).lineTo(x, height); }
    for (let y = 0; y < height; y += 40) { this.grid.moveTo(0, y).lineTo(width, y); }
    this.grid.stroke({ color: Theme.border, width: 0.5, alpha: 0.15 });

    // Glow
    this.glow.clear().circle(width / 2, 100, 300).fill({ color: Theme.accent, alpha: 0.03 });

    // Centered layout
    const cx = width / 2;
    const isSmall = height < 600;
    const topMargin = isSmall ? 20 : Math.max(60, height * 0.15);

    this.title.x = cx;
    this.title.y = topMargin;

    this.subtitle.x = cx;
    this.subtitle.y = topMargin + 60;

    this.statusDot.x = cx - 60;
    this.statusDot.y = topMargin + 100;
    this.statusText.x = cx - 50;
    this.statusText.y = topMargin + 93;
    if (this.statusIcon) {
      this.statusIcon.x = cx - 75;
      this.statusIcon.y = topMargin + 92;
    }

    // Cards
    const totalCardW = 320 * 2 + 40;
    const contentScale = Math.min(1, width / (totalCardW + 40), height / 500);
    this.cardContainer.scale.set(contentScale);
    this.cardContainer.x = cx - (totalCardW / 2) * contentScale;
    this.cardContainer.y = topMargin + 160 * contentScale;

    // Version
    this.version.x = cx;
    this.version.y = height - 20;
  }

  onUpdate(dt: number): void {
    if (this.animProgress < 1) {
      this.animProgress = Math.min(1, this.animProgress + dt * 0.03);
      this.cards.forEach((card, i) => {
        const t = Math.max(0, this.animProgress - i * 0.15);
        const eased = easeOutCubic(Math.min(1, t / 0.7));
        card.alpha = eased;
        card.y = 40 * (1 - eased);
      });
    }
  }

  onExit(): void {}

  private createCard(title: string, desc: string, w: number, h: number, onClick: () => void, icon?: Graphics): Container {
    const card = new Container();
    card.eventMode = 'static';
    card.cursor = 'pointer';

    const bg = new Graphics();
    const drawBg = (hover: boolean) => {
      bg.clear();
      bg.roundRect(2, 2, w, h, Theme.radiusL).fill({ color: 0x000000, alpha: 0.2 });
      bg.roundRect(0, 0, w, h, Theme.radiusL).fill({ color: hover ? Theme.bgCardHover : Theme.bgCard });
      bg.roundRect(0, 0, w, h, Theme.radiusL).stroke({ color: hover ? Theme.accent : Theme.border, width: hover ? 2 : 1 });
      bg.roundRect(0, 0, w, 4, Theme.radiusL).fill({ color: Theme.accent, alpha: hover ? 1 : 0.4 });
    };
    drawBg(false);
    card.addChild(bg);

    if (icon) {
      icon.x = Theme.paddingL; icon.y = 38;
      card.addChild(icon);
    }
    const titleOffsetX = icon ? Theme.paddingL + 36 : Theme.paddingL;

    const titleText = new Text({
      text: title,
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeXL, fontWeight: '700', fill: Theme.textPrimary },
    });
    titleText.x = titleOffsetX; titleText.y = 40;
    card.addChild(titleText);

    const descText = new Text({
      text: desc,
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textSecondary, wordWrap: true, wordWrapWidth: w - Theme.paddingL * 2 },
    });
    descText.x = Theme.paddingL; descText.y = 85;
    card.addChild(descText);

    const arrow = drawArrowRight(22, Theme.accent);
    arrow.x = w - Theme.paddingL - 22; arrow.y = h - Theme.paddingL - 22;
    card.addChild(arrow);

    card.on('pointerover', () => { drawBg(true); card.scale.set(1.02); });
    card.on('pointerout', () => { drawBg(false); card.scale.set(1); });
    card.on('pointertap', onClick);

    return card;
  }
}
