/**
 * Settings & Calibration Scene.
 * Two-tab layout: General settings + Calibration (plastic card method).
 * Inspired by FrACT10 CardController.j and Settings panel.
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Scene } from '../core/SceneManager';
import { Theme } from '../ui/Theme';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH_MM, CARD_HEIGHT_MM } from '../core/Globals';
import { getSetting, setSetting, isCalibrated, getMMPerPixel } from '../core/Settings';
import { pixelFromMillimeter } from '../utils/SpatialUtils';
import { SoundManager } from '../core/SoundManager';

type Tab = 'general' | 'calibration';

export class SettingsScene implements Scene {
  readonly container = new Container();
  private sceneManager: { goTo(name: string): void };
  private activeTab: Tab = 'general';

  // calibration state
  private calCardGfx: Graphics | null = null;
  private calInfoText: Text | null = null;
  private calStatusText: Text | null = null;

  // general state
  private distSlider: Slider | null = null;
  private distLabel: Text | null = null;
  private roundsSlider: Slider | null = null;
  private roundsLabel: Text | null = null;

  constructor(sceneManager: { goTo(name: string): void }) {
    this.sceneManager = sceneManager;
  }

  onEnter(): void {
    SoundManager.init();
    this.buildUI();
  }

  onUpdate(_dt: number): void {}
  onExit(): void {}

  private buildUI(): void {
    this.container.removeChildren();

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
      text: '⚙️  設定與校正',
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.textPrimary },
    });
    headerTitle.x = Theme.paddingL;
    headerTitle.y = 16;
    this.container.addChild(headerTitle);

    const backBtn = new Button({
      label: '← 返回目錄',
      width: 130, height: 36,
      fontSize: Theme.fontSizeS,
      variant: 'ghost',
      onClick: () => this.sceneManager.goTo('mainMenu'),
    });
    backBtn.x = CANVAS_WIDTH - 150;
    backBtn.y = 10;
    this.container.addChild(backBtn);

    // ── Tabs ──
    const tabY = 72;
    const tabW = 140;
    const tabH = 36;

    const drawTab = (label: string, x: number, tab: Tab) => {
      const isActive = this.activeTab === tab;
      const btn = new Container();
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const tbg = new Graphics();
      tbg.roundRect(0, 0, tabW, tabH, Theme.radiusS);
      tbg.fill({ color: isActive ? Theme.accent : Theme.bgCard });
      btn.addChild(tbg);

      const txt = new Text({
        text: label,
        style: {
          fontFamily: Theme.fontFamily,
          fontSize: Theme.fontSizeS,
          fontWeight: isActive ? '700' : '500',
          fill: isActive ? Theme.bg : Theme.textSecondary,
        },
      });
      txt.anchor.set(0.5);
      txt.x = tabW / 2;
      txt.y = tabH / 2;
      btn.addChild(txt);

      btn.x = x;
      btn.y = tabY;
      btn.on('pointertap', () => { this.activeTab = tab; this.buildUI(); });
      this.container.addChild(btn);
    };

    const tabStartX = (CANVAS_WIDTH - (tabW * 2 + 12)) / 2;
    drawTab('一般設定', tabStartX, 'general');
    drawTab('螢幕校正', tabStartX + tabW + 12, 'calibration');

    // ── Content area ──
    const contentY = 125;
    if (this.activeTab === 'general') {
      this.buildGeneralTab(contentY);
    } else {
      this.buildCalibrationTab(contentY);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  General Tab
  // ═══════════════════════════════════════════════════════════
  private buildGeneralTab(startY: number): void {
    const cx = CANVAS_WIDTH / 2;
    const cardW = 600;
    let y = startY;

    // ── Viewing Distance ──
    const distCard = this.makeSettingCard(
      '觀看距離',
      '受試者眼睛至螢幕的距離（公分）',
      (cx - cardW / 2), y, cardW, 100,
    );
    this.container.addChild(distCard);

    this.distLabel = new Text({
      text: `${getSetting('distanceInCM')} cm`,
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.accent },
    });
    this.distLabel.x = cardW - Theme.paddingL - 80;
    this.distLabel.y = 14;
    distCard.addChild(this.distLabel);

    this.distSlider = new Slider({
      width: cardW - Theme.paddingL * 2,
      min: 20, max: 200,
      value: getSetting('distanceInCM'),
      step: 5,
      onChange: (v) => {
        setSetting('distanceInCM', v);
        if (this.distLabel) this.distLabel.text = `${v} cm`;
      },
    });
    this.distSlider.x = Theme.paddingL;
    this.distSlider.y = 60;
    distCard.addChild(this.distSlider);

    y += 120;

    // ── Total Rounds ──
    const roundsCard = this.makeSettingCard(
      '訓練回合數',
      '每次訓練的總回合數',
      (cx - cardW / 2), y, cardW, 100,
    );
    this.container.addChild(roundsCard);

    this.roundsLabel = new Text({
      text: `${getSetting('totalRounds')} 回合`,
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.accent },
    });
    this.roundsLabel.x = cardW - Theme.paddingL - 100;
    this.roundsLabel.y = 14;
    roundsCard.addChild(this.roundsLabel);

    this.roundsSlider = new Slider({
      width: cardW - Theme.paddingL * 2,
      min: 1, max: 30,
      value: getSetting('totalRounds'),
      step: 1,
      onChange: (v) => {
        setSetting('totalRounds', v);
        if (this.roundsLabel) this.roundsLabel.text = `${v} 回合`;
      },
    });
    this.roundsSlider.x = Theme.paddingL;
    this.roundsSlider.y = 60;
    roundsCard.addChild(this.roundsSlider);

    y += 120;

    // ── Sound toggle ──
    const soundCard = this.makeSettingCard(
      '音效回饋',
      '訓練時的正確/錯誤音效',
      (cx - cardW / 2), y, cardW, 70,
    );
    this.container.addChild(soundCard);

    const soundEnabled = getSetting('auditoryFeedbackEnabled');
    const toggleBtn = new Button({
      label: soundEnabled ? '✓ 已開啟' : '✗ 已關閉',
      width: 120, height: 32,
      fontSize: Theme.fontSizeS,
      variant: soundEnabled ? 'primary' : 'secondary',
      onClick: () => {
        setSetting('auditoryFeedbackEnabled', !getSetting('auditoryFeedbackEnabled'));
        this.buildUI();
      },
    });
    toggleBtn.x = cardW - Theme.paddingL - 120;
    toggleBtn.y = 15;
    soundCard.addChild(toggleBtn);

    y += 90;

    // ── Volume slider ──
    const volCard = this.makeSettingCard(
      '音量',
      '',
      (cx - cardW / 2), y, cardW, 70,
    );
    this.container.addChild(volCard);

    const volLabel = new Text({
      text: `${getSetting('soundVolume')}%`,
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600', fill: Theme.accent },
    });
    volLabel.x = cardW - Theme.paddingL - 50;
    volLabel.y = 8;
    volCard.addChild(volLabel);

    const volSlider = new Slider({
      width: cardW - Theme.paddingL * 2,
      min: 0, max: 100, value: getSetting('soundVolume'), step: 5,
      onChange: (v) => { setSetting('soundVolume', v); volLabel.text = `${v}%`; },
    });
    volSlider.x = Theme.paddingL;
    volSlider.y = 40;
    volCard.addChild(volSlider);
  }

  // ═══════════════════════════════════════════════════════════
  //  Calibration Tab (inspired by FrACT10 CardController.j)
  // ═══════════════════════════════════════════════════════════
  private buildCalibrationTab(startY: number): void {
    const cx = CANVAS_WIDTH / 2;

    // ── Instructions ──
    const instrText = new Text({
      text: '請拿出一張標準塑膠卡片（身分證、信用卡或健保卡），\n輕靠在螢幕上。使用下方按鈕調整，直到卡片大小完全一致。',
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Theme.fontSizeM,
        fill: Theme.textSecondary,
        align: 'center',
        lineHeight: 22,
      },
    });
    instrText.anchor.set(0.5, 0);
    instrText.x = cx;
    instrText.y = startY;
    this.container.addChild(instrText);

    // ── Plastic card rectangle ──
    this.calCardGfx = new Graphics();
    this.drawCalibrationCard();
    this.container.addChild(this.calCardGfx);

    // ── Card label ──
    const cardLabel = new Text({
      text: `${CARD_WIDTH_MM}mm × ${CARD_HEIGHT_MM}mm`,
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeS, fill: Theme.textPrimary },
    });
    cardLabel.anchor.set(0.5);
    cardLabel.x = cx;
    cardLabel.y = 310;
    this.container.addChild(cardLabel);

    // ── +/- Buttons (inspired by FrACT10's ++, +, -, -- buttons) ──
    const btnY = 370;
    const btnLabels = ['− −', '−', '+', '+ +'];
    const factors = [1.1, 1.01, 1.0 / 1.01, 1.0 / 1.1];
    const btnW = 70;
    const gap = 12;
    const totalBtnW = btnW * 4 + gap * 3;
    const btnStartX = (CANVAS_WIDTH - totalBtnW) / 2;

    btnLabels.forEach((label, i) => {
      const btn = new Button({
        label,
        width: btnW,
        height: 40,
        fontSize: Theme.fontSizeL,
        variant: 'secondary',
        onClick: () => {
          const current = getSetting('calBarLengthInMM');
          setSetting('calBarLengthInMM', current * factors[i]);
          this.drawCalibrationCard();
          this.updateCalInfo();
        },
      });
      btn.x = btnStartX + i * (btnW + gap);
      btn.y = btnY;
      this.container.addChild(btn);
    });

    // Instruction for buttons
    const btnInstr = new Text({
      text: '← 使用 ± 按鈕調整螢幕上的卡片大小 →',
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeS, fill: Theme.textMuted },
    });
    btnInstr.anchor.set(0.5);
    btnInstr.x = cx;
    btnInstr.y = btnY + 50;
    this.container.addChild(btnInstr);

    // ── Calibration Info ──
    this.calInfoText = new Text({
      text: '',
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textSecondary, align: 'center' },
    });
    this.calInfoText.anchor.set(0.5);
    this.calInfoText.x = cx;
    this.calInfoText.y = 455;
    this.container.addChild(this.calInfoText);

    // ── Status indicator ──
    this.calStatusText = new Text({
      text: '',
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600', fill: Theme.success },
    });
    this.calStatusText.anchor.set(0.5);
    this.calStatusText.x = cx;
    this.calStatusText.y = 485;
    this.container.addChild(this.calStatusText);

    this.updateCalInfo();

    // ── Reset button ──
    const resetBtn = new Button({
      label: '重設校正值',
      width: 140, height: 36,
      fontSize: Theme.fontSizeS,
      variant: 'danger',
      onClick: () => {
        setSetting('calBarLengthInMM', 149);
        this.drawCalibrationCard();
        this.updateCalInfo();
      },
    });
    resetBtn.x = cx - 70;
    resetBtn.y = 520;
    this.container.addChild(resetBtn);
  }

  private drawCalibrationCard(): void {
    if (!this.calCardGfx) return;
    this.calCardGfx.clear();

    const wPx = pixelFromMillimeter(CARD_WIDTH_MM);
    const hPx = pixelFromMillimeter(CARD_HEIGHT_MM);
    const cx = CANVAS_WIDTH / 2;
    const cy = 260;

    // card shadow
    this.calCardGfx.roundRect(cx - wPx / 2 + 3, cy - hPx / 2 + 3, wPx, hPx, 8);
    this.calCardGfx.fill({ color: 0x000000, alpha: 0.3 });

    // card body
    this.calCardGfx.roundRect(cx - wPx / 2, cy - hPx / 2, wPx, hPx, 8);
    this.calCardGfx.fill({ color: Theme.calibrationBox, alpha: 0.85 });
    this.calCardGfx.roundRect(cx - wPx / 2, cy - hPx / 2, wPx, hPx, 8);
    this.calCardGfx.stroke({ color: Theme.accentHover, width: 2 });

    // corner markers
    const m = 10;
    const corners = [
      [cx - wPx / 2, cy - hPx / 2],
      [cx + wPx / 2, cy - hPx / 2],
      [cx - wPx / 2, cy + hPx / 2],
      [cx + wPx / 2, cy + hPx / 2],
    ];
    corners.forEach(([x, y]) => {
      this.calCardGfx!.circle(x, y, 3);
      this.calCardGfx!.fill({ color: Theme.textPrimary });
      // cross-hairs
      this.calCardGfx!.moveTo(x - m, y);
      this.calCardGfx!.lineTo(x + m, y);
      this.calCardGfx!.moveTo(x, y - m);
      this.calCardGfx!.lineTo(x, y + m);
      this.calCardGfx!.stroke({ color: Theme.textPrimary, width: 1, alpha: 0.5 });
    });
  }

  private updateCalInfo(): void {
    const mmPerPx = getMMPerPixel();
    if (this.calInfoText) {
      this.calInfoText.text = `解析度: ${mmPerPx.toFixed(3)} mm/px  (${(1 / mmPerPx).toFixed(2)} px/mm)`;
    }
    if (this.calStatusText) {
      const cal = isCalibrated();
      this.calStatusText.text = cal ? '✓ 校正完成' : '⚠ 尚未校正（使用預設值）';
      this.calStatusText.style.fill = cal ? Theme.success : Theme.warning;
    }
  }

  private makeSettingCard(title: string, desc: string, x: number, y: number, w: number, h: number): Container {
    const card = new Container();
    card.x = x;
    card.y = y;

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, Theme.radiusM);
    bg.fill({ color: Theme.bgCard });
    bg.roundRect(0, 0, w, h, Theme.radiusM);
    bg.stroke({ color: Theme.border, width: 1 });
    card.addChild(bg);

    const titleText = new Text({
      text: title,
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600', fill: Theme.textPrimary },
    });
    titleText.x = Theme.paddingL;
    titleText.y = 12;
    card.addChild(titleText);

    if (desc) {
      const descText = new Text({
        text: desc,
        style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeXS, fill: Theme.textMuted },
      });
      descText.x = Theme.paddingL;
      descText.y = 34;
      card.addChild(descText);
    }

    return card;
  }
}
