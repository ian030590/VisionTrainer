/**
 * Settings & Calibration Scene.
 * Two-tab layout: General settings + Calibration (plastic card method).
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneManager } from '../core/SceneManager';
import { Theme } from '../ui/Theme';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { CARD_WIDTH_MM, CARD_HEIGHT_MM } from '../core/Globals';
import { getSetting, setSetting, isCalibrated, getMMPerPixel } from '../core/Settings';
import { pixelFromMillimeter } from '../utils/SpatialUtils';
import { SoundManager } from '../core/SoundManager';
import { drawArrowLeft, drawGear, drawPencil, drawCheck, drawCross, drawWarning } from '../ui/Icons';

type Tab = 'general' | 'calibration';

export class SettingsScene implements Scene {
  readonly container = new Container();
  private sm: SceneManager;
  private activeTab: Tab = 'general';

  // shared layout
  private bg = new Graphics();
  private header = new Graphics();
  private headerTitle = new Text();
  private backBtn: Button;
  private tabsContainer = new Container();

  // content containers
  private generalContainer = new Container();
  private calContainer = new Container();

  // calibration state
  private calInstrText = new Text();
  private calCardGfx = new Graphics();
  private calLabelText = new Text();
  private calBtnContainer = new Container();
  private btnInstr = new Text();
  private calInfoText = new Text();
  private calStatusText = new Text();
  private calResetBtn: Button;

  // layout cache
  private cachedW = 800;
  private cachedH = 600;

  constructor(sm: SceneManager) {
    this.sm = sm;

    this.backBtn = new Button({
      label: '  返回目錄', width: 130, height: 36, fontSize: Theme.fontSizeS, variant: 'ghost',
      onClick: () => this.sm.goTo('mainMenu'),
    });
    const backArrow = drawArrowLeft(14, Theme.textSecondary);
    backArrow.x = 8; backArrow.y = 11;
    this.backBtn.addChild(backArrow);
    
    this.calResetBtn = new Button({
      label: '重設校正值', width: 140, height: 36, fontSize: Theme.fontSizeS, variant: 'danger',
      onClick: () => {
        setSetting('calBarLengthInMM', 149);
        this.updateCalibrationUI();
      },
    });

    this.container.addChild(this.bg);
    this.container.addChild(this.header);
    this.container.addChild(this.headerTitle);
    this.container.addChild(this.backBtn);
    this.container.addChild(this.tabsContainer);
    this.container.addChild(this.generalContainer);
    this.container.addChild(this.calContainer);

    this.initHeader();
    this.initCalibrationElements();
  }

  onEnter(): void {
    SoundManager.init();
    this.buildTabs();
    this.buildGeneralTab();
    this.updateCalibrationUI();
    this.switchTab(this.activeTab);
  }

  private initHeader(): void {
    this.headerTitle.text = '設定與校正';
    this.headerTitle.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.textPrimary };
    this.headerTitle.x = Theme.paddingL + 26;
    const gearIcon = drawGear(20, Theme.accent);
    gearIcon.x = Theme.paddingL;
    gearIcon.y = 18;
    this.container.addChild(gearIcon);
  }

  private initCalibrationElements(): void {
    this.calInstrText.text = '請拿出一張標準塑膠卡片（身分證、信用卡或健保卡），\n輕靠在螢幕上。使用下方按鈕調整，直到卡片大小完全一致。';
    this.calInstrText.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textSecondary, align: 'center', lineHeight: 22 };
    this.calInstrText.anchor.set(0.5, 0);
    this.calContainer.addChild(this.calInstrText);
    
    this.calContainer.addChild(this.calCardGfx);
    
    this.calLabelText.text = `${CARD_WIDTH_MM}mm × ${CARD_HEIGHT_MM}mm`;
    this.calLabelText.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeS, fill: Theme.textPrimary };
    this.calLabelText.anchor.set(0.5);
    this.calContainer.addChild(this.calLabelText);

    const btnLabels = ['− −', '−', '+', '+ +'];
    const factors = [1.1, 1.01, 1.0 / 1.01, 1.0 / 1.1];
    const btnW = 70;
    const gap = 12;
    btnLabels.forEach((label, i) => {
      const btn = new Button({
        label, width: btnW, height: 40, fontSize: Theme.fontSizeL, variant: 'secondary',
        onClick: () => {
          const current = getSetting('calBarLengthInMM');
          setSetting('calBarLengthInMM', current * factors[i]);
          this.updateCalibrationUI();
        },
      });
      btn.x = i * (btnW + gap);
      this.calBtnContainer.addChild(btn);
    });
    this.calContainer.addChild(this.calBtnContainer);

    this.btnInstr.text = '使用 ± 按鈕調整螢幕上的卡片大小';
    this.btnInstr.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeS, fill: Theme.textMuted };
    this.btnInstr.anchor.set(0.5);
    this.calContainer.addChild(this.btnInstr);

    this.calInfoText.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textSecondary, align: 'center' };
    this.calInfoText.anchor.set(0.5);
    this.calContainer.addChild(this.calInfoText);

    this.calStatusText.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600' };
    this.calStatusText.anchor.set(0.5);
    this.calContainer.addChild(this.calStatusText);

    this.calContainer.addChild(this.calResetBtn);
  }

  private switchTab(tab: Tab): void {
    this.activeTab = tab;
    this.buildTabs();
    this.generalContainer.visible = tab === 'general';
    this.calContainer.visible = tab === 'calibration';
    if (tab === 'calibration') this.updateCalibrationUI();
  }

  private buildTabs(): void {
    this.tabsContainer.removeChildren();
    const tabW = 140;
    const tabH = 36;
    
    const drawTab = (label: string, x: number, tab: Tab) => {
      const isActive = this.activeTab === tab;
      const btn = new Container();
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const tbg = new Graphics();
      tbg.roundRect(0, 0, tabW, tabH, Theme.radiusS).fill({ color: isActive ? Theme.accent : Theme.bgCard });
      btn.addChild(tbg);

      const txt = new Text({ text: label, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeS, fontWeight: isActive ? '700' : '500', fill: isActive ? Theme.bg : Theme.textSecondary } });
      txt.anchor.set(0.5);
      txt.x = tabW / 2; txt.y = tabH / 2;
      btn.addChild(txt);

      btn.x = x;
      btn.on('pointertap', () => this.switchTab(tab));
      this.tabsContainer.addChild(btn);
    };

    drawTab('一般設定', 0, 'general');
    drawTab('螢幕校正', tabW + 12, 'calibration');
  }

  private buildGeneralTab(): void {
    this.generalContainer.removeChildren();
    const cardW = Math.min(600, this.cachedW - 40);
    let y = 0;

    // Viewing Distance
    const distCard = this.makeSettingCard('觀看距離', '受試者眼睛至螢幕的距離（公分）', cardW, 80);
    distCard.y = y;
    const distLabel = new Text({ text: `${getSetting('distanceInCM')} cm`, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.accent } });
    const distEditBtn = new Button({
      label: ' 編輯', width: 90, height: 32, fontSize: Theme.fontSizeS, variant: 'secondary',
      onClick: () => {
        const input = window.prompt('請輸入觀看距離 (cm):', getSetting('distanceInCM').toString());
        if (input !== null) {
          const val = parseFloat(input);
          if (!isNaN(val) && val >= 10 && val <= 500) {
            setSetting('distanceInCM', val);
            this.buildGeneralTab();
          } else {
            window.alert('請輸入有效的數字 (10 ~ 500)');
          }
        }
      }
    });
    distEditBtn.x = cardW - Theme.paddingL - 90; distEditBtn.y = 24;
    const distPencil = drawPencil(14, Theme.textSecondary);
    distPencil.x = 8; distPencil.y = 9;
    distEditBtn.addChild(distPencil);
    distLabel.x = distEditBtn.x - distLabel.width - 20; distLabel.y = 26;
    distCard.addChild(distLabel, distEditBtn);
    this.generalContainer.addChild(distCard);
    y += 100;

    // Download Directory
    const dirCard = this.makeSettingCard('成績下載檔案前綴', '設定匯出成績時的檔案前綴或識別碼', cardW, 80);
    dirCard.y = y;
    let dirVal = getSetting('downloadDirectory');
    let displayVal = dirVal || '(未設定)';
    if (displayVal.length > 12) displayVal = displayVal.substring(0, 12) + '...';
    
    const dirLabel = new Text({ text: displayVal, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '700', fill: dirVal ? Theme.accent : Theme.textMuted } });
    const dirEditBtn = new Button({
      label: ' 編輯', width: 90, height: 32, fontSize: Theme.fontSizeS, variant: 'secondary',
      onClick: () => {
        const input = window.prompt('請輸入成績檔案前綴:', getSetting('downloadDirectory'));
        if (input !== null) {
          setSetting('downloadDirectory', input);
          this.buildGeneralTab();
        }
      }
    });
    dirEditBtn.x = cardW - Theme.paddingL - 90; dirEditBtn.y = 24;
    const dirPencil = drawPencil(14, Theme.textSecondary);
    dirPencil.x = 8; dirPencil.y = 9;
    dirEditBtn.addChild(dirPencil);
    dirLabel.x = dirEditBtn.x - dirLabel.width - 20; dirLabel.y = 28;
    dirCard.addChild(dirLabel, dirEditBtn);
    this.generalContainer.addChild(dirCard);
    y += 100;

    // Sound toggle
    const soundCard = this.makeSettingCard('音效回饋', '訓練時的正確/錯誤音效', cardW, 80);
    soundCard.y = y;
    const soundEnabled = getSetting('auditoryFeedbackEnabled');
    const toggleBtn = new Button({
      label: soundEnabled ? ' 已開啟' : ' 已關閉', width: 120, height: 32, fontSize: Theme.fontSizeS, variant: soundEnabled ? 'primary' : 'secondary',
      onClick: () => { setSetting('auditoryFeedbackEnabled', !getSetting('auditoryFeedbackEnabled')); this.buildGeneralTab(); },
    });
    toggleBtn.x = cardW - Theme.paddingL - 120; toggleBtn.y = 24;
    const toggleIcon = soundEnabled ? drawCheck(14, Theme.success) : drawCross(14, Theme.error);
    toggleIcon.x = 8; toggleIcon.y = 9;
    toggleBtn.addChild(toggleIcon);
    soundCard.addChild(toggleBtn);
    this.generalContainer.addChild(soundCard);
  }

  private updateCalibrationUI(): void {
    if (this.activeTab !== 'calibration') return;

    this.calCardGfx.clear();
    const wPx = pixelFromMillimeter(CARD_WIDTH_MM);
    const hPx = pixelFromMillimeter(CARD_HEIGHT_MM);

    // Anchor to Top center + margin (70px below the instruction text)
    const cx = 0; 
    const cy = 70 + hPx / 2;

    // shadow
    this.calCardGfx.roundRect(cx - wPx / 2 + 3, cy - hPx / 2 + 3, wPx, hPx, 8).fill({ color: 0x000000, alpha: 0.3 });
    // card body
    this.calCardGfx.roundRect(cx - wPx / 2, cy - hPx / 2, wPx, hPx, 8).fill({ color: Theme.calibrationBox, alpha: 0.85 });
    this.calCardGfx.roundRect(cx - wPx / 2, cy - hPx / 2, wPx, hPx, 8).stroke({ color: Theme.accentHover, width: 2 });
    
    // corner markers
    const m = 10;
    const corners = [[cx - wPx / 2, cy - hPx / 2], [cx + wPx / 2, cy - hPx / 2], [cx - wPx / 2, cy + hPx / 2], [cx + wPx / 2, cy + hPx / 2]];
    corners.forEach(([x, y]) => {
      this.calCardGfx.circle(x, y, 3).fill({ color: Theme.textPrimary });
      this.calCardGfx.moveTo(x - m, y).lineTo(x + m, y).moveTo(x, y - m).lineTo(x, y + m).stroke({ color: Theme.textPrimary, width: 1, alpha: 0.5 });
    });

    // Update positions dynamically based on card height
    // So buttons are always below the card, no overlapping!
    const cardBottomY = cy + hPx / 2;
    
    this.calLabelText.y = cardBottomY + 20;
    this.calBtnContainer.y = cardBottomY + 50;
    this.btnInstr.y = cardBottomY + 110;
    this.calInfoText.y = cardBottomY + 150;
    this.calStatusText.y = cardBottomY + 180;
    this.calResetBtn.y = cardBottomY + 220;
    
    // Center button container X
    this.calBtnContainer.x = -(70 * 4 + 12 * 3) / 2;
    this.calResetBtn.x = -70;

    const mmPerPx = getMMPerPixel();
    this.calInfoText.text = `解析度: ${mmPerPx.toFixed(3)} mm/px  (${(1 / mmPerPx).toFixed(2)} px/mm)`;
    const cal = isCalibrated();
    this.calStatusText.text = cal ? ' 校正完成' : ' 尚未校正（使用預設值）';
    this.calStatusText.style.fill = cal ? Theme.success : Theme.warning;
  }

  onResize(width: number, height: number): void {
    this.cachedW = width;
    this.cachedH = height;

    this.bg.clear().rect(0, 0, width, height).fill({ color: Theme.bg });
    this.header.clear().rect(0, 0, width, 56).fill({ color: Theme.bgPanel }).rect(0, 55, width, 1).fill({ color: Theme.border });
    
    this.headerTitle.x = Theme.paddingL; this.headerTitle.y = 16;
    this.backBtn.x = width - 150; this.backBtn.y = 10;
    
    const cx = width / 2;
    
    const tabW = 140;
    this.tabsContainer.x = cx - (tabW * 2 + 12) / 2;
    this.tabsContainer.y = 80;

    const contentY = 140;
    
    // General container centering and scaling
    const generalScale = Math.min(1, height / 650);
    this.generalContainer.scale.set(generalScale);
    this.generalContainer.x = cx - (Math.min(600, width - 40) / 2) * generalScale;
    this.generalContainer.y = contentY;

    // Cal container centering and scaling
    const calScale = Math.min(1, height / 700);
    this.calContainer.scale.set(calScale);
    this.calContainer.x = cx; // elements inside use cx=0, scaling from cx keeps it perfectly centered
    this.calContainer.y = contentY;

    // Refresh general if width changed
    if (this.activeTab === 'general') this.buildGeneralTab();
  }

  onExit(): void {}

  private makeSettingCard(title: string, desc: string, w: number, h: number): Container {
    const card = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, Theme.radiusM).fill({ color: Theme.bgCard }).roundRect(0, 0, w, h, Theme.radiusM).stroke({ color: Theme.border, width: 1 });
    card.addChild(bg);
    const titleText = new Text({ text: title, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600', fill: Theme.textPrimary } });
    titleText.x = Theme.paddingL; titleText.y = 12;
    card.addChild(titleText);
    if (desc) {
      const descText = new Text({ text: desc, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeXS, fill: Theme.textMuted } });
      descText.x = Theme.paddingL; descText.y = 34;
      card.addChild(descText);
    }
    return card;
  }
}
