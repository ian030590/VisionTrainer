/**
 * Training List Scene — displays all registered training modules.
 * Automatically populated from TrainingRegistry.
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneManager } from '../core/SceneManager';
import { Theme } from '../ui/Theme';
import { Button } from '../ui/Button';
import { TrainingRegistry } from '../trainings/TrainingRegistry';
import { SoundManager } from '../core/SoundManager';
import { easeOutCubic } from '../utils/MathUtils';

export class TrainingListScene implements Scene {
  readonly container = new Container();
  private sm: SceneManager;
  
  private bg = new Graphics();
  private header = new Graphics();
  private headerTitle = new Text();
  private backBtn: Button;
  private title = new Text();
  private subtitle = new Text();
  private emptyText = new Text();
  private cardContainer = new Container();
  private cardContainers: Container[] = [];
  private animProgress = 0;

  constructor(sm: SceneManager) {
    this.sm = sm;
    
    this.container.addChild(this.bg);
    this.container.addChild(this.header);
    this.container.addChild(this.headerTitle);
    
    this.backBtn = new Button({
      label: '← 返回目錄', width: 130, height: 36, fontSize: Theme.fontSizeS, variant: 'ghost',
      onClick: () => this.sm.goTo('mainMenu'),
    });
    this.container.addChild(this.backBtn);
    
    this.container.addChild(this.title);
    this.container.addChild(this.subtitle);
    this.container.addChild(this.emptyText);
    this.container.addChild(this.cardContainer);
    
    this.initElements();
  }

  private initElements(): void {
    this.headerTitle.text = 'ReadingTrainer';
    this.headerTitle.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.textPrimary };
    
    this.title.text = '訓練清單';
    this.title.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSize2XL, fontWeight: '700', fill: Theme.textPrimary };
    this.title.anchor.set(0.5, 0);

    this.subtitle.text = '請選擇您想進行的訓練項目';
    this.subtitle.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textSecondary };
    this.subtitle.anchor.set(0.5, 0);
    
    this.emptyText.text = '目前沒有可用的訓練模組';
    this.emptyText.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fill: Theme.textMuted };
    this.emptyText.anchor.set(0.5);
  }

  onEnter(): void {
    this.animProgress = 0;
    this.cardContainers = [];
    this.cardContainer.removeChildren();

    const modules = TrainingRegistry.getAll();
    const cardW = 700;
    const cardH = 90;
    const gap = 12;

    modules.forEach((mod, i) => {
      const card = this.createTrainingCard(mod.meta.icon, mod.meta.name, mod.meta.description, cardW, cardH, () => {
        SoundManager.init();
        const sceneName = `training_${mod.meta.id}`;
        this.sm.register(sceneName, mod.createScene());
        this.sm.goTo(sceneName);
      });
      card.y = i * (cardH + gap);
      card.alpha = 0;
      this.cardContainers.push(card);
      this.cardContainer.addChild(card);
    });

    this.emptyText.visible = modules.length === 0;
  }

  onResize(width: number, height: number): void {
    this.bg.clear().rect(0, 0, width, height).fill({ color: Theme.bg });
    this.header.clear().rect(0, 0, width, 56).fill({ color: Theme.bgPanel }).rect(0, 55, width, 1).fill({ color: Theme.border });
    
    this.headerTitle.x = Theme.paddingL;
    this.headerTitle.y = 16;
    
    this.backBtn.x = width - 150;
    this.backBtn.y = 10;
    
    const cx = width / 2;
    this.title.x = cx;
    this.title.y = 80;
    
    this.subtitle.x = cx;
    this.subtitle.y = 120;
    
    this.emptyText.x = cx;
    this.emptyText.y = 300;
    
    const cardW = 700;
    const requiredH = 165 + (this.cardContainers.length * 102);
    const contentScale = Math.min(1, width / (cardW + 40), height / (requiredH + 20));
    
    this.cardContainer.scale.set(contentScale);
    this.cardContainer.x = cx - (cardW / 2) * contentScale;
    this.cardContainer.y = 165;
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
      bg.roundRect(0, 0, w, h, Theme.radiusM).fill({ color: hover ? Theme.bgCardHover : Theme.bgCard });
      bg.roundRect(0, 0, w, h, Theme.radiusM).stroke({ color: hover ? Theme.accent : Theme.border, width: hover ? 2 : 1 });
    };
    drawBg(false);
    card.addChild(bg);

    const iconText = new Text({ text: icon, style: { fontFamily: Theme.fontFamily, fontSize: 32 } });
    iconText.x = Theme.paddingL; iconText.y = (h - 40) / 2;
    card.addChild(iconText);

    const titleText = new Text({ text: name, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.textPrimary } });
    titleText.x = 75; titleText.y = 18;
    card.addChild(titleText);

    const descText = new Text({ text: desc, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeS, fill: Theme.textSecondary, wordWrap: true, wordWrapWidth: w - 120 } });
    descText.x = 75; descText.y = 48;
    card.addChild(descText);

    const arrow = new Text({ text: '→', style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeXL, fill: Theme.accent } });
    arrow.x = w - Theme.paddingL - 20; arrow.y = (h - 28) / 2;
    card.addChild(arrow);

    card.on('pointerover', () => { drawBg(true); card.scale.set(1.01); });
    card.on('pointerout', () => { drawBg(false); card.scale.set(1); });
    card.on('pointertap', onClick);

    return card;
  }
}
