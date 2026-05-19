/**
 * Training List Scene — displays all registered training modules.
 * Automatically populated from TrainingRegistry.
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneManager } from '../core/SceneManager';
import { Theme } from '../ui/Theme';
import { Button } from '../ui/Button';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../core/Globals';
import { TrainingRegistry } from '../trainings/TrainingRegistry';
import { SoundManager } from '../core/SoundManager';
import { easeOutCubic } from '../utils/MathUtils';

export class TrainingListScene implements Scene {
  readonly container = new Container();
  private sm: SceneManager;
  private cardContainers: Container[] = [];
  private animProgress = 0;

  constructor(sm: SceneManager) {
    this.sm = sm;
  }

  onEnter(): void {
    this.container.removeChildren();
    this.cardContainers = [];
    this.animProgress = 0;

    // ── Background ──
    const bg = new Graphics();
    bg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bg.fill({ color: Theme.bg });
    this.container.addChild(bg);

    // ── Header bar ──
    const header = new Graphics();
    header.rect(0, 0, CANVAS_WIDTH, 56);
    header.fill({ color: Theme.bgPanel });
    header.rect(0, 55, CANVAS_WIDTH, 1);
    header.fill({ color: Theme.border });
    this.container.addChild(header);

    const headerTitle = new Text({
      text: 'ReadingTrainer',
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeL,
        fontWeight: '700',
        fill: Theme.textPrimary,
      },
    });
    headerTitle.x = Theme.paddingL;
    headerTitle.y = 16;
    this.container.addChild(headerTitle);

    // back button
    const backBtn = new Button({
      label: '← 返回目錄',
      width: 130,
      height: 36,
      fontSize: Theme.fontSizeS,
      variant: 'ghost',
      onClick: () => this.sm.goTo('mainMenu'),
    });
    backBtn.x = CANVAS_WIDTH - 150;
    backBtn.y = 10;
    this.container.addChild(backBtn);

    // ── Page title ──
    const title = new Text({
      text: '訓練清單',
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSize2XL,
        fontWeight: '700',
        fill: Theme.textPrimary,
      },
    });
    title.anchor.set(0.5, 0);
    title.x = CANVAS_WIDTH / 2;
    title.y = 80;
    this.container.addChild(title);

    const subtitle = new Text({
      text: '請選擇您想進行的訓練項目',
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeM,
        fill: Theme.textSecondary,
      },
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = CANVAS_WIDTH / 2;
    subtitle.y = 120;
    this.container.addChild(subtitle);

    // ── Training module cards ──
    const modules = TrainingRegistry.getAll();
    const cardW = 700;
    const cardH = 90;
    const startY = 165;
    const gap = 12;

    modules.forEach((mod, i) => {
      const card = this.createTrainingCard(mod.meta.icon, mod.meta.name, mod.meta.description, cardW, cardH, () => {
        SoundManager.init();
        // register the training scene dynamically
        const sceneName = `training_${mod.meta.id}`;
        if (!this.sm.getCurrentSceneName() || true) {
          this.sm.register(sceneName, mod.createScene());
        }
        this.sm.goTo(sceneName);
      });
      card.x = (CANVAS_WIDTH - cardW) / 2;
      card.y = startY + i * (cardH + gap);
      card.alpha = 0;
      this.cardContainers.push(card);
      this.container.addChild(card);
    });

    if (modules.length === 0) {
      const empty = new Text({
        text: '目前沒有可用的訓練模組',
        style: {
          fontFamily: Theme.fontFamily,
          fontSize: Theme.fontSizeL,
          fill: Theme.textMuted,
        },
      });
      empty.anchor.set(0.5);
      empty.x = CANVAS_WIDTH / 2;
      empty.y = 300;
      this.container.addChild(empty);
    }
  }

  onUpdate(dt: number): void {
    if (this.animProgress < 1) {
      this.animProgress = Math.min(1, this.animProgress + dt * 0.04);
      this.cardContainers.forEach((card, i) => {
        const t = Math.max(0, this.animProgress - i * 0.1);
        const eased = easeOutCubic(Math.min(1, t / 0.6));
        card.alpha = eased;
      });
    }
  }

  onExit(): void {}

  private createTrainingCard(icon: string, name: string, desc: string, w: number, h: number, onClick: () => void): Container {
    const card = new Container();
    card.eventMode = 'static';
    card.cursor = 'pointer';

    const bg = new Graphics();
    const drawBg = (hover: boolean) => {
      bg.clear();
      bg.roundRect(0, 0, w, h, Theme.radiusM);
      bg.fill({ color: hover ? Theme.bgCardHover : Theme.bgCard });
      bg.roundRect(0, 0, w, h, Theme.radiusM);
      bg.stroke({ color: hover ? Theme.accent : Theme.border, width: hover ? 2 : 1 });
    };
    drawBg(false);
    card.addChild(bg);

    // icon
    const iconText = new Text({
      text: icon,
      style: { fontFamily: Theme.fontFamily, fontSize: 32 },
    });
    iconText.x = Theme.paddingL;
    iconText.y = (h - 40) / 2;
    card.addChild(iconText);

    // title
    const titleText = new Text({
      text: name,
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeL,
        fontWeight: '700',
        fill: Theme.textPrimary,
      },
    });
    titleText.x = 75;
    titleText.y = 18;
    card.addChild(titleText);

    // description
    const descText = new Text({
      text: desc,
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeS,
        fill: Theme.textSecondary,
        wordWrap: true,
        wordWrapWidth: w - 120,
      },
    });
    descText.x = 75;
    descText.y = 48;
    card.addChild(descText);

    // arrow
    const arrow = new Text({
      text: '→',
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeXL,
        fill: Theme.accent,
      },
    });
    arrow.x = w - Theme.paddingL - 20;
    arrow.y = (h - 28) / 2;
    card.addChild(arrow);

    card.on('pointerover', () => { drawBg(true); card.scale.set(1.01); });
    card.on('pointerout', () => { drawBg(false); card.scale.set(1); });
    card.on('pointertap', onClick);

    return card;
  }
}
