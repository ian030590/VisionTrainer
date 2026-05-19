/**
 * Main Menu Scene — the landing page of ReadingTrainer.
 * Dark scientific UI with animated cards.
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Scene } from '../core/SceneManager';
import { Theme } from '../ui/Theme';
import { CANVAS_WIDTH, CANVAS_HEIGHT, APP_VERSION } from '../core/Globals';
import { isCalibrated } from '../core/Settings';
import { SoundManager } from '../core/SoundManager';
import { easeOutCubic } from '../utils/MathUtils';

export class MainMenuScene implements Scene {
  readonly container = new Container();
  private sceneManager: { goTo(name: string): void };
  private cards: Container[] = [];
  private animProgress = 0;

  constructor(sceneManager: { goTo(name: string): void }) {
    this.sceneManager = sceneManager;
  }

  onEnter(): void {
    this.container.removeChildren();
    this.cards = [];
    this.animProgress = 0;

    // ── Background gradient ──
    const bg = new Graphics();
    bg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bg.fill({ color: Theme.bg });
    this.container.addChild(bg);

    // ── Decorative grid lines ──
    const grid = new Graphics();
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      grid.moveTo(x, 0);
      grid.lineTo(x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      grid.moveTo(0, y);
      grid.lineTo(CANVAS_WIDTH, y);
    }
    grid.stroke({ color: Theme.border, width: 0.5, alpha: 0.15 });
    this.container.addChild(grid);

    // ── Title ──
    const title = new Text({
      text: 'ReadingTrainer',
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSize3XL,
        fontWeight: '700',
        fill: Theme.textPrimary,
        letterSpacing: 2,
      },
    });
    title.anchor.set(0.5, 0);
    title.x = CANVAS_WIDTH / 2;
    title.y = 60;
    this.container.addChild(title);

    // ── Subtitle ──
    const subtitle = new Text({
      text: '視覺與閱讀能力訓練系統',
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeL,
        fill: Theme.textSecondary,
      },
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = CANVAS_WIDTH / 2;
    subtitle.y = 120;
    this.container.addChild(subtitle);

    // ── Calibration status ──
    const calibrated = isCalibrated();
    const statusDot = new Graphics();
    statusDot.circle(0, 0, 5);
    statusDot.fill({ color: calibrated ? Theme.success : Theme.warning });
    statusDot.x = CANVAS_WIDTH / 2 - 60;
    statusDot.y = 160;
    this.container.addChild(statusDot);

    const statusText = new Text({
      text: calibrated ? '已完成螢幕校正' : '⚠ 尚未校正螢幕',
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeS,
        fill: calibrated ? Theme.success : Theme.warning,
      },
    });
    statusText.x = CANVAS_WIDTH / 2 - 50;
    statusText.y = 153;
    this.container.addChild(statusText);

    // ── Menu Cards ──
    const cardData = [
      {
        title: '🏋️  訓練清單',
        desc: '選擇並進入不同的閱讀與視覺訓練項目',
        target: 'trainingList',
      },
      {
        title: '⚙️  設定與校正',
        desc: '調整觀看距離、進行螢幕尺寸校正',
        target: 'settings',
      },
    ];

    const cardW = 320;
    const cardH = 180;
    const gap = 40;
    const startX = (CANVAS_WIDTH - (cardW * 2 + gap)) / 2;
    const cardY = 220;

    cardData.forEach((data, i) => {
      const card = this.createCard(data.title, data.desc, cardW, cardH, () => {
        SoundManager.init();
        this.sceneManager.goTo(data.target);
      });
      card.x = startX + i * (cardW + gap);
      card.y = cardY;
      // animation: start off-screen
      card.alpha = 0;
      card.y = cardY + 40;
      this.cards.push(card);
      this.container.addChild(card);
    });

    // ── Version ──
    const version = new Text({
      text: `v${APP_VERSION}  •  TypeScript + PixiJS`,
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeXS,
        fill: Theme.textMuted,
      },
    });
    version.anchor.set(0.5, 1);
    version.x = CANVAS_WIDTH / 2;
    version.y = CANVAS_HEIGHT - 20;
    this.container.addChild(version);

    // ── Accent glow decoration ──
    const glow = new Graphics();
    glow.circle(CANVAS_WIDTH / 2, 100, 200);
    glow.fill({ color: Theme.accent, alpha: 0.03 });
    this.container.addChildAt(glow, 1);
  }

  onUpdate(dt: number): void {
    if (this.animProgress < 1) {
      this.animProgress = Math.min(1, this.animProgress + dt * 0.03);
      const cardY = 220;
      this.cards.forEach((card, i) => {
        const t = Math.max(0, this.animProgress - i * 0.15);
        const eased = easeOutCubic(Math.min(1, t / 0.7));
        card.alpha = eased;
        card.y = cardY + 40 * (1 - eased);
      });
    }
  }

  onExit(): void {}

  private createCard(title: string, desc: string, w: number, h: number, onClick: () => void): Container {
    const card = new Container();
    card.eventMode = 'static';
    card.cursor = 'pointer';

    const bg = new Graphics();
    const drawBg = (hover: boolean) => {
      bg.clear();
      // shadow
      bg.roundRect(2, 2, w, h, Theme.radiusL);
      bg.fill({ color: 0x000000, alpha: 0.2 });
      // card bg
      bg.roundRect(0, 0, w, h, Theme.radiusL);
      bg.fill({ color: hover ? Theme.bgCardHover : Theme.bgCard });
      // border
      bg.roundRect(0, 0, w, h, Theme.radiusL);
      bg.stroke({ color: hover ? Theme.accent : Theme.border, width: hover ? 2 : 1 });
      // accent bar at top
      bg.roundRect(0, 0, w, 4, Theme.radiusL);
      bg.fill({ color: Theme.accent, alpha: hover ? 1 : 0.4 });
    };
    drawBg(false);
    card.addChild(bg);

    const titleText = new Text({
      text: title,
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeXL,
        fontWeight: '700',
        fill: Theme.textPrimary,
      },
    });
    titleText.x = Theme.paddingL;
    titleText.y = 40;
    card.addChild(titleText);

    const descText = new Text({
      text: desc,
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeM,
        fill: Theme.textSecondary,
        wordWrap: true,
        wordWrapWidth: w - Theme.paddingL * 2,
      },
    });
    descText.x = Theme.paddingL;
    descText.y = 85;
    card.addChild(descText);

    // arrow indicator
    const arrow = new Text({
      text: '→',
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeXL,
        fill: Theme.accent,
      },
    });
    arrow.x = w - Theme.paddingL - 20;
    arrow.y = h - Theme.paddingL - 20;
    card.addChild(arrow);

    card.on('pointerover', () => { drawBg(true); card.scale.set(1.02); });
    card.on('pointerout', () => { drawBg(false); card.scale.set(1); });
    card.on('pointertap', onClick);

    return card;
  }
}
