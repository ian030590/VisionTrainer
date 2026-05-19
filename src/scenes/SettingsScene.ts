/**
 * Settings & Calibration Scene.
 * Two-tab layout: General settings + Calibration (plastic card method).
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneManager } from '../core/SceneManager';
import { Theme } from '../ui/Theme';
import { Button } from '../ui/Button';
import { CARD_WIDTH_MM, CARD_HEIGHT_MM, CAL_BAR_LENGTH_PX } from '../core/Globals';
import { getSetting, setSetting, isCalibrated, getMMPerPixel } from '../core/Settings';
import { pixelFromMillimeter } from '../utils/SpatialUtils';
import { SoundManager } from '../core/SoundManager';
import { drawArrowLeft, drawGear, drawPencil, drawCheck, drawCross, drawWarning } from '../ui/Icons';

type Tab = 'general' | 'calibration' | 'gamma' | 'contrast' | 'crowding';

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
  private gammaContainer = new Container();
  private contrastContainer = new Container();
  private crowdingContainer = new Container();

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

  private calMode: 'ruler' | 'card' = 'ruler';
  private isRulerInputActive = false;
  private rulerInputStr = "";
  
  private isDistanceInputActive = false;
  private distanceInputStr = "";
  
  private isPrefixInputActive = false;
  private prefixInputStr = "";

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
        this.buildCalibrationTab();
      },
    });

    this.container.addChild(this.bg);
    this.container.addChild(this.header);
    this.container.addChild(this.headerTitle);
    this.container.addChild(this.backBtn);
    this.container.addChild(this.tabsContainer);
    this.container.addChild(this.generalContainer);
    this.container.addChild(this.calContainer);
    this.container.addChild(this.gammaContainer);
    this.container.addChild(this.contrastContainer);
    this.container.addChild(this.crowdingContainer);

    this.initHeader();
    this.initCalibrationElements();
  }

  onEnter(): void {
    SoundManager.init();
    window.addEventListener('keydown', this.handleKeyDown);
    this.buildTabs();
    this.buildGeneralTab();
    this.buildCalibrationTab();
    this.switchTab(this.activeTab);
  }

  onExit(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.activeTab === 'general') {
      if (this.isDistanceInputActive) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          this.isDistanceInputActive = false;
          this.applyDistanceInput();
          return;
        }
        if (e.key === 'Backspace') {
          this.distanceInputStr = this.distanceInputStr.slice(0, -1);
          this.buildGeneralTab();
          return;
        }
        if (e.key >= '0' && e.key <= '9') {
          if (this.distanceInputStr.length < 3) {
            this.distanceInputStr += e.key;
            this.buildGeneralTab();
          }
        }
        return;
      }

      if (this.isPrefixInputActive) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          this.isPrefixInputActive = false;
          this.applyPrefixInput();
          return;
        }
        if (e.key === 'Backspace') {
          this.prefixInputStr = this.prefixInputStr.slice(0, -1);
          this.buildGeneralTab();
          return;
        }
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (this.prefixInputStr.length < 20) {
            this.prefixInputStr += e.key;
            this.buildGeneralTab();
          }
        }
        return;
      }
    }

    if (this.activeTab !== 'calibration' || this.calMode !== 'ruler' || !this.isRulerInputActive) return;
    
    if (e.key === 'Enter' || e.key === 'Escape') {
      this.isRulerInputActive = false;
      this.applyRulerInput();
      return;
    }

    if (e.key === 'Backspace') {
      this.rulerInputStr = this.rulerInputStr.slice(0, -1);
      this.buildCalibrationTab();
      return;
    }

    if (e.key >= '0' && e.key <= '9') {
      if (this.rulerInputStr.length < 5) {
        this.rulerInputStr += e.key;
        this.buildCalibrationTab();
      }
    } else if (e.key === '.') {
      if (!this.rulerInputStr.includes('.')) {
        this.rulerInputStr += '.';
        this.buildCalibrationTab();
      }
    }
  };

  private applyRulerInput() {
    const val = parseFloat(this.rulerInputStr);
    if (!isNaN(val) && val > 0 && val <= 10000) {
      setSetting('rulerLengthInMM', val);
      // For calibration, assume standard pixel length 500 for the ruler UI
      const rulerBarPx = 500; 
      const pxPerMM = rulerBarPx / val;
      const newCalBarMM = CAL_BAR_LENGTH_PX / pxPerMM;
      setSetting('calBarLengthInMM', newCalBarMM);
    }
    this.buildCalibrationTab();
  }

  private applyDistanceInput() {
    const val = parseFloat(this.distanceInputStr);
    if (!isNaN(val) && val >= 10 && val <= 500) {
      setSetting('distanceInCM', val);
    } else {
      window.alert('請輸入有效的數字 (10 ~ 500)');
    }
    this.buildGeneralTab();
  }

  private applyPrefixInput() {
    setSetting('downloadDirectory', this.prefixInputStr);
    this.buildGeneralTab();
  }

  private initHeader(): void {
    this.headerTitle.text = '設定與校正';
    this.headerTitle.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.textPrimary };
    this.headerTitle.x = Theme.paddingL + 32;
    const gearIcon = drawGear(20, Theme.accent);
    gearIcon.x = Theme.paddingL;
    gearIcon.y = 18;
    this.container.addChild(gearIcon);
  }

  private initCalibrationElements(): void {
    this.calInstrText.text = '請拿出一張標準塑膠卡片（身分證、信用卡或健保卡），\n輕靠在螢幕上。使用下方按鈕調整，直到卡片大小完全一致。';
    this.calInstrText.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textSecondary, align: 'center', lineHeight: 22 };
    this.calInstrText.anchor.set(0.5, 0);

    this.calLabelText.text = `${CARD_WIDTH_MM}mm × ${CARD_HEIGHT_MM}mm`;
    this.calLabelText.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeS, fill: Theme.textPrimary };
    this.calLabelText.anchor.set(0.5);

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
          this.buildCalibrationTab();
        },
      });
      btn.x = i * (btnW + gap);
      this.calBtnContainer.addChild(btn);
    });

    this.btnInstr.text = '使用 ± 按鈕調整螢幕上的卡片大小';
    this.btnInstr.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeS, fill: Theme.textMuted };
    this.btnInstr.anchor.set(0.5);

    this.calInfoText.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textSecondary, align: 'center' };
    this.calInfoText.anchor.set(0.5);

    this.calStatusText.style = { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600' };
    this.calStatusText.anchor.set(0.5);
  }

  private switchTab(tab: Tab): void {
    this.activeTab = tab;
    this.buildTabs();
    this.generalContainer.visible = tab === 'general';
    this.calContainer.visible = tab === 'calibration';
    this.gammaContainer.visible = tab === 'gamma';
    this.contrastContainer.visible = tab === 'contrast';
    this.crowdingContainer.visible = tab === 'crowding';
    if (tab === 'calibration') this.buildCalibrationTab();
    if (tab === 'gamma') this.buildGammaTab();
    if (tab === 'contrast') this.buildContrastTab();
    if (tab === 'crowding') this.buildCrowdingTab();
  }

  private buildTabs(): void {
    this.tabsContainer.removeChildren();
    const tabW = 100;
    const tabH = 32;
    const gap = 6;
    
    const drawTab = (label: string, x: number, tab: Tab) => {
      const isActive = this.activeTab === tab;
      const btn = new Container();
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const tbg = new Graphics();
      tbg.roundRect(0, 0, tabW, tabH, Theme.radiusS).fill({ color: isActive ? Theme.accent : Theme.bgCard });
      if (!isActive) tbg.roundRect(0, 0, tabW, tabH, Theme.radiusS).stroke({ color: Theme.border, width: 1 });
      btn.addChild(tbg);

      const txt = new Text({ text: label, style: { fontFamily: Theme.fontFamily, fontSize: 13, fontWeight: isActive ? '700' : '500', fill: isActive ? Theme.bg : Theme.textSecondary } });
      txt.anchor.set(0.5);
      txt.x = tabW / 2; txt.y = tabH / 2;
      btn.addChild(txt);

      btn.x = x;
      btn.on('pointertap', () => this.switchTab(tab));
      this.tabsContainer.addChild(btn);
    };

    const tabs: { label: string; tab: Tab }[] = [
      { label: '一般設定', tab: 'general' },
      { label: '螢幕校正', tab: 'calibration' },
      { label: 'Gamma', tab: 'gamma' },
      { label: '對比度', tab: 'contrast' },
      { label: 'Crowding', tab: 'crowding' },
    ];
    tabs.forEach((t, i) => drawTab(t.label, i * (tabW + gap), t.tab));
  }

  private buildGeneralTab(): void {
    this.generalContainer.removeChildren();
    const cardW = Math.min(600, this.cachedW - 40);
    let y = 0;

    // Viewing Distance
    const distCard = this.makeSettingCard('觀看距離', '受試者眼睛至螢幕的距離（公分）', cardW, 80);
    distCard.y = y;
    
    if (this.isDistanceInputActive) {
      const inputBox = new Container();
      const boxW = 100, boxH = 40;
      const bg = new Graphics();
      bg.roundRect(0, 0, boxW, boxH, Theme.radiusS).fill({ color: Theme.bg });
      bg.roundRect(0, 0, boxW, boxH, Theme.radiusS).stroke({ color: Theme.accent, width: 2 });
      inputBox.addChild(bg);

      const txt = new Text({ text: this.distanceInputStr + '|', style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textPrimary, fontWeight: '700' } });
      txt.anchor.set(0.5);
      txt.x = boxW / 2; txt.y = boxH / 2;
      inputBox.addChild(txt);

      const okBtn = new Button({ label: '確認', width: 60, height: 40, fontSize: Theme.fontSizeS, variant: 'primary', onClick: () => {
        this.isDistanceInputActive = false;
        this.applyDistanceInput();
      }});
      okBtn.x = boxW + 10;
      inputBox.addChild(okBtn);

      inputBox.x = cardW - Theme.paddingL - boxW - 70;
      inputBox.y = 20;
      distCard.addChild(inputBox);
    } else {
      const distLabel = new Text({ text: `${getSetting('distanceInCM')} cm`, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.accent } });
      const distEditBtn = new Button({
        label: ' 編輯', width: 90, height: 32, fontSize: Theme.fontSizeS, variant: 'secondary',
        onClick: () => {
          this.isDistanceInputActive = true;
          this.isPrefixInputActive = false;
          this.distanceInputStr = getSetting('distanceInCM').toString();
          this.buildGeneralTab();
        }
      });
      distEditBtn.x = cardW - Theme.paddingL - 90; distEditBtn.y = 24;
      const distPencil = drawPencil(14, Theme.textSecondary);
      distPencil.x = 8; distPencil.y = 9;
      distEditBtn.addChild(distPencil);
      distLabel.x = distEditBtn.x - distLabel.width - 20; distLabel.y = 26;
      distCard.addChild(distLabel, distEditBtn);
    }
    this.generalContainer.addChild(distCard);
    y += 100;

    // Download Directory
    const dirCard = this.makeSettingCard('成績下載檔案前綴', '設定匯出成績時的檔案前綴或識別碼', cardW, 80);
    dirCard.y = y;
    let dirVal = getSetting('downloadDirectory');
    
    if (this.isPrefixInputActive) {
      const inputBox = new Container();
      const boxW = 160, boxH = 40;
      const bg = new Graphics();
      bg.roundRect(0, 0, boxW, boxH, Theme.radiusS).fill({ color: Theme.bg });
      bg.roundRect(0, 0, boxW, boxH, Theme.radiusS).stroke({ color: Theme.accent, width: 2 });
      inputBox.addChild(bg);

      const txt = new Text({ text: this.prefixInputStr + '|', style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textPrimary, fontWeight: '700' } });
      txt.anchor.set(0.5);
      txt.x = boxW / 2; txt.y = boxH / 2;
      inputBox.addChild(txt);

      const okBtn = new Button({ label: '確認', width: 60, height: 40, fontSize: Theme.fontSizeS, variant: 'primary', onClick: () => {
        this.isPrefixInputActive = false;
        this.applyPrefixInput();
      }});
      okBtn.x = boxW + 10;
      inputBox.addChild(okBtn);

      inputBox.x = cardW - Theme.paddingL - boxW - 70;
      inputBox.y = 20;
      dirCard.addChild(inputBox);
    } else {
      let displayVal = dirVal || '(未設定)';
      if (displayVal.length > 12) displayVal = displayVal.substring(0, 12) + '...';
      
      const dirLabel = new Text({ text: displayVal, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '700', fill: dirVal ? Theme.accent : Theme.textMuted } });
      const dirEditBtn = new Button({
        label: ' 編輯', width: 90, height: 32, fontSize: Theme.fontSizeS, variant: 'secondary',
        onClick: () => {
          this.isPrefixInputActive = true;
          this.isDistanceInputActive = false;
          this.prefixInputStr = getSetting('downloadDirectory');
          this.buildGeneralTab();
        }
      });
      dirEditBtn.x = cardW - Theme.paddingL - 90; dirEditBtn.y = 24;
      const dirPencil = drawPencil(14, Theme.textSecondary);
      dirPencil.x = 8; dirPencil.y = 9;
      dirEditBtn.addChild(dirPencil);
      dirLabel.x = dirEditBtn.x - dirLabel.width - 20; dirLabel.y = 28;
      dirCard.addChild(dirLabel, dirEditBtn);
    }
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

  private buildCalibrationTab(): void {
    if (this.activeTab !== 'calibration') return;

    this.calContainer.removeChildren();

    const cx = 0;
    const mmPerPx = getMMPerPixel();
    const cal = isCalibrated();
    const infoTextStr = `解析度: ${mmPerPx.toFixed(3)} mm/px  (${(1 / mmPerPx).toFixed(2)} px/mm)\n${cal ? '校正完成' : '尚未校正（使用預設值）'}`;

    // Mode Switch Buttons at the top
    const btnRuler = new Button({ label: '尺規校正', width: 140, height: 36, fontSize: Theme.fontSizeM, variant: this.calMode === 'ruler' ? 'primary' : 'ghost', onClick: () => { this.calMode = 'ruler'; this.buildCalibrationTab(); } });
    btnRuler.x = cx - 145; btnRuler.y = -10;
    this.calContainer.addChild(btnRuler);

    const btnCard = new Button({ label: '卡片校正', width: 140, height: 36, fontSize: Theme.fontSizeM, variant: this.calMode === 'card' ? 'primary' : 'ghost', onClick: () => { this.calMode = 'card'; this.buildCalibrationTab(); } });
    btnCard.x = cx + 5; btnCard.y = -10;
    this.calContainer.addChild(btnCard);

    if (this.calMode === 'ruler') {
      const rulerDesc = new Text({ text: '請拿出一把實體尺放在螢幕上，與下方的藍色線條對齊。\n然後在下方直接點擊輸入藍色線條的實際長度(mm)。', style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textSecondary, align: 'center', lineHeight: 24 } });
      rulerDesc.anchor.set(0.5, 0); rulerDesc.y = 50; rulerDesc.x = cx;
      this.calContainer.addChild(rulerDesc);

      const rulerBarPx = 500;
      const rulerGfx = new Graphics();
      const rulerY = 120;
      // Single thick line
      rulerGfx.roundRect(cx - rulerBarPx / 2, rulerY, rulerBarPx, 8, 4).fill({ color: Theme.accent });
      this.calContainer.addChild(rulerGfx);

      const inputBox = new Container();
      inputBox.eventMode = 'static';
      inputBox.cursor = 'text';
      inputBox.on('pointerdown', (e) => {
        e.stopPropagation();
        if (!this.isRulerInputActive) {
          this.isRulerInputActive = true;
          const curRuler = getSetting('rulerLengthInMM');
          this.rulerInputStr = curRuler > 0 ? curRuler.toString() : '';
          this.buildCalibrationTab();
        }
      });
      const boxW = 200, boxH = 46;
      inputBox.x = cx - boxW / 2;
      inputBox.y = rulerY + 50;
      
      const bg = new Graphics();
      bg.roundRect(0, 0, boxW, boxH, Theme.radiusS).fill({ color: Theme.bgCard });
      bg.roundRect(0, 0, boxW, boxH, Theme.radiusS).stroke({ color: this.isRulerInputActive ? Theme.accent : Theme.border, width: 2 });
      inputBox.addChild(bg);

      const displayText = this.isRulerInputActive ? this.rulerInputStr + '|' : (getSetting('rulerLengthInMM') > 0 ? `${getSetting('rulerLengthInMM')} mm` : '點此輸入長度');
      const txt = new Text({ text: displayText, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fill: this.isRulerInputActive ? Theme.textPrimary : Theme.textSecondary, fontWeight: '700' } });
      txt.anchor.set(0.5);
      txt.x = boxW / 2; txt.y = boxH / 2;
      inputBox.addChild(txt);

      if (this.isRulerInputActive) {
        const okBtn = new Button({ label: '確認', width: 70, height: 46, fontSize: Theme.fontSizeM, variant: 'primary', onClick: () => {
          this.isRulerInputActive = false;
          this.applyRulerInput();
        }});
        okBtn.x = boxW + 10;
        inputBox.addChild(okBtn);
      } else {
        const editPencil = drawPencil(18, Theme.textSecondary);
        editPencil.x = boxW - 30; editPencil.y = boxH / 2 - 9;
        inputBox.addChild(editPencil);
      }
      this.calContainer.addChild(inputBox);

      const infoText = new Text({ text: infoTextStr, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeS, fill: cal ? Theme.success : Theme.warning, align: 'center', lineHeight: 22 } });
      infoText.anchor.set(0.5, 0); infoText.x = cx; infoText.y = rulerY + 115;
      this.calContainer.addChild(infoText);

      const saveBtn = new Button({ label: '儲存校正', width: 140, height: 40, fontSize: Theme.fontSizeS, variant: 'primary', onClick: () => { window.alert('尺規校正值已儲存！'); } });
      saveBtn.x = cx - 70; saveBtn.y = rulerY + 175;
      this.calContainer.addChild(saveBtn);

    } else {
      // CARD CALIBRATION MODE
      this.calInstrText.y = 50;
      this.calContainer.addChild(this.calInstrText);
      
      this.calCardGfx.clear();
      const wPx = pixelFromMillimeter(CARD_WIDTH_MM);
      const hPx = pixelFromMillimeter(CARD_HEIGHT_MM);

      const cy = 110 + hPx / 2;

      // shadow
      this.calCardGfx.roundRect(cx - wPx / 2 + 3, cy - hPx / 2 + 3, wPx, hPx, 8).fill({ color: 0x000000, alpha: 0.3 });
      // card body
      this.calCardGfx.roundRect(cx - wPx / 2, cy - hPx / 2, wPx, hPx, 8).fill({ color: Theme.calibrationBox, alpha: 0.85 });
      this.calCardGfx.roundRect(cx - wPx / 2, cy - hPx / 2, wPx, hPx, 8).stroke({ color: Theme.accentHover, width: 2 });
      
      const m = 10;
      const corners = [[cx - wPx / 2, cy - hPx / 2], [cx + wPx / 2, cy - hPx / 2], [cx - wPx / 2, cy + hPx / 2], [cx + wPx / 2, cy + hPx / 2]];
      corners.forEach(([x, y]) => {
        this.calCardGfx.circle(x, y, 3).fill({ color: Theme.textPrimary });
        this.calCardGfx.moveTo(x - m, y).lineTo(x + m, y).moveTo(x, y - m).lineTo(x, y + m).stroke({ color: Theme.textPrimary, width: 1, alpha: 0.5 });
      });
      this.calContainer.addChild(this.calCardGfx);

      const cardBottomY = cy + hPx / 2;
      
      this.calLabelText.y = cardBottomY + 15;
      this.calLabelText.x = cx;
      this.calContainer.addChild(this.calLabelText);

      this.calBtnContainer.y = cardBottomY + 45;
      this.calBtnContainer.x = cx - (70 * 4 + 12 * 3) / 2;
      this.calContainer.addChild(this.calBtnContainer);

      this.btnInstr.y = cardBottomY + 95;
      this.btnInstr.x = cx;
      this.calContainer.addChild(this.btnInstr);

      this.calInfoText.text = infoTextStr;
      this.calInfoText.y = cardBottomY + 125;
      this.calInfoText.x = cx;
      this.calContainer.addChild(this.calInfoText);
      
      const btnGrpY = cardBottomY + 185;
      this.calResetBtn.y = btnGrpY;
      this.calResetBtn.x = cx - 150;
      this.calContainer.addChild(this.calResetBtn);

      const saveBtn = new Button({ label: '儲存校正', width: 140, height: 36, fontSize: Theme.fontSizeS, variant: 'primary', onClick: () => { window.alert('卡片校正值已儲存！'); } });
      saveBtn.x = cx + 10; saveBtn.y = btnGrpY;
      this.calContainer.addChild(saveBtn);
    }
  }

  onResize(width: number, height: number): void {
    this.cachedW = width;
    this.cachedH = height;

    this.bg.clear().rect(0, 0, width, height).fill({ color: Theme.bg });
    this.header.clear().rect(0, 0, width, 56).fill({ color: Theme.bgPanel }).rect(0, 55, width, 1).fill({ color: Theme.border });
    
    this.headerTitle.x = Theme.paddingL + 32; this.headerTitle.y = 16;
    this.backBtn.x = width - 150; this.backBtn.y = 10;
    
    const cx = width / 2;
    
    const tabW = 100;
    const gap = 6;
    const totalTabsW = tabW * 5 + gap * 4;
    this.tabsContainer.x = cx - totalTabsW / 2;
    this.tabsContainer.y = 80;

    const contentY = 130;
    const cardW = Math.min(600, width - 40);
    
    // General container
    const generalScale = Math.min(1, height / 650);
    this.generalContainer.scale.set(generalScale);
    this.generalContainer.x = cx - (cardW / 2) * generalScale;
    this.generalContainer.y = contentY;

    // Cal container
    const calScale = Math.min(1, height / 900);
    this.calContainer.scale.set(calScale);
    this.calContainer.x = cx;
    this.calContainer.y = contentY;

    // Contrast / Crowding containers (all same layout)
    const panelScale = Math.min(1, height / 600);
    for (const c of [this.contrastContainer, this.crowdingContainer]) {
      c.scale.set(panelScale);
      c.x = cx - (cardW / 2) * panelScale;
      c.y = contentY;
    }
    
    // Gamma container scaling
    const gammaScale = Math.min(1, height / 800);
    this.gammaContainer.scale.set(gammaScale);
    this.gammaContainer.x = cx - (cardW / 2) * gammaScale;
    this.gammaContainer.y = contentY;

    // Refresh active tab
    if (this.activeTab === 'general') this.buildGeneralTab();
    if (this.activeTab === 'calibration') this.buildCalibrationTab();
    if (this.activeTab === 'gamma') this.buildGammaTab();
    if (this.activeTab === 'contrast') this.buildContrastTab();
    if (this.activeTab === 'crowding') this.buildCrowdingTab();
  }

  // ── Gamma Tab ──
  private buildGammaTab(): void {
    this.gammaContainer.removeChildren();
    const cardW = Math.min(600, this.cachedW - 40);
    const gammaVal = getSetting('gammaValue');
    const checkGfx = new Graphics();
    const checkSize = 4;
    
    // Background is 9x larger than the checkerboard in area
    // So edge length is 3x the checkerboard edge length. Both are squares.
    const bgSize = 480; 
    const checkW = bgSize / 3;
    const checkH = bgSize / 3;
    
    const gray50 = Math.pow(0.5, 1.0 / gammaVal);
    const gray50Hex = Math.round(gray50 * 255);
    const gray50Color = (gray50Hex << 16) | (gray50Hex << 8) | gray50Hex;
    
    const areaX = (cardW - bgSize) / 2;
    const areaY = 70;
    // Strict square background
    checkGfx.rect(areaX, areaY, bgSize, bgSize).fill({ color: gray50Color });
    
    // Small centered checkerboard
    const checkX = areaX + (bgSize - checkW) / 2;
    const checkY = areaY + (bgSize - checkH) / 2;
    
    const gPlus = Math.pow(0.05, 1.0 / gammaVal);
    const gMinus = Math.pow(0.95, 1.0 / gammaVal);
    const gPlusHex = Math.round(gPlus * 255);
    const gMinusHex = Math.round(gMinus * 255);
    const darkColor = (gPlusHex << 16) | (gPlusHex << 8) | gPlusHex;
    const lightColor = (gMinusHex << 16) | (gMinusHex << 8) | gMinusHex;
    
    for (let iy = 0; iy < checkH; iy += checkSize) {
      for (let ix = 0; ix < checkW; ix += checkSize) {
        const isEven = ((ix / checkSize + iy / checkSize) % 2) === 0;
        checkGfx.rect(checkX + ix, checkY + iy, checkSize, checkSize).fill({ color: isEven ? darkColor : lightColor });
      }
    }
    this.gammaContainer.addChild(checkGfx);
    
    const gammaTitle = new Text({ text: 'Gamma 校正', style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600', fill: Theme.textPrimary } });
    gammaTitle.x = Theme.paddingL; gammaTitle.y = 8;
    this.gammaContainer.addChild(gammaTitle);
    
    const gammaDesc = new Text({ text: '調整 Gamma 值直到中央棋盤圖案與周圍灰色完全融合。預設值 2.0。', style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeXS, fill: Theme.textMuted } });
    gammaDesc.x = Theme.paddingL; gammaDesc.y = 32;
    this.gammaContainer.addChild(gammaDesc);
    
    const bottomY = areaY + bgSize + 30;
    const gammaLabel = new Text({ text: `Gamma: ${gammaVal.toFixed(2)}`, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.accent } });
    gammaLabel.x = Theme.paddingL; gammaLabel.y = bottomY;
    this.gammaContainer.addChild(gammaLabel);

    // Gamma +/- buttons
    const gmBtns = [{ label: '− 0.1', delta: -0.1 }, { label: '− 0.01', delta: -0.01 }, { label: '+ 0.01', delta: 0.01 }, { label: '+ 0.1', delta: 0.1 }];
    gmBtns.forEach((b, i) => {
      const btn = new Button({ label: b.label, width: 75, height: 32, fontSize: Theme.fontSizeS, variant: 'secondary', onClick: () => {
        const cur = getSetting('gammaValue');
        const nv = Math.round((cur + b.delta) * 100) / 100;
        if (nv >= 0.8 && nv <= 4.0) { setSetting('gammaValue', nv); this.buildGammaTab(); }
      }});
      btn.x = cardW - Theme.paddingL - (4 - i) * 87; btn.y = bottomY;
      this.gammaContainer.addChild(btn);
    });
  }

  // ── Contrast Tab ──
  private buildContrastTab(): void {
    this.contrastContainer.removeChildren();
    const cardW = Math.min(600, this.cachedW - 40);
    const contTitle = new Text({ text: '對比度檢查 (Check Contrast)', style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600', fill: Theme.textPrimary } });
    contTitle.x = Theme.paddingL; contTitle.y = 8;
    this.contrastContainer.addChild(contTitle);
    const contDesc = new Text({ text: '檢查您的螢幕能否顯示不同 Weber 對比度等級。應能看到內圈與外圈之差異。', style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeXS, fill: Theme.textMuted } });
    contDesc.x = Theme.paddingL; contDesc.y = 32;
    this.contrastContainer.addChild(contDesc);
    const weberLevels = [1, 3, 10, 30, 90];
    const gv = getSetting('gammaValue');
    const sampleW = Math.min(90, (cardW - Theme.paddingL * 2 - 16 * 4) / 5);
    weberLevels.forEach((wp, i) => {
      const michelson = wp / (200 + wp);
      const lum1 = 0.5 * (1 - michelson);
      const lum2 = 0.5 * (1 + michelson);
      const dg1 = Math.pow(lum1, 1.0 / gv);
      const dg2 = Math.pow(lum2, 1.0 / gv);
      const hex1 = Math.round(dg1 * 255);
      const hex2 = Math.round(dg2 * 255);
      const c1 = (hex1 << 16) | (hex1 << 8) | hex1;
      const c2 = (hex2 << 16) | (hex2 << 8) | hex2;
      const sx = Theme.paddingL + i * (sampleW + 16);
      const sy = 60;
      const sampleGfx = new Graphics();
      sampleGfx.rect(sx, sy, sampleW, sampleW * 0.7).fill({ color: c2 });
      sampleGfx.circle(sx + sampleW / 2, sy + sampleW * 0.35, sampleW * 0.22).fill({ color: c1 });
      this.contrastContainer.addChild(sampleGfx);
      const lbl = new Text({ text: `${wp}%`, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeXS, fill: Theme.textSecondary, align: 'center' } });
      lbl.anchor.set(0.5, 0); lbl.x = sx + sampleW / 2; lbl.y = sy + sampleW * 0.7 + 6;
      this.contrastContainer.addChild(lbl);
    });
  }

  // ── Crowding Tab ──
  private buildCrowdingTab(): void {
    this.crowdingContainer.removeChildren();
    const cardW = Math.min(600, this.cachedW - 40);
    const crowdTitle = new Text({ text: 'Crowding 設定', style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600', fill: Theme.textPrimary } });
    crowdTitle.x = Theme.paddingL; crowdTitle.y = 8;
    this.crowdingContainer.addChild(crowdTitle);
    const crowdDesc = new Text({ text: '設定擠壓效應類型與間距，影響周邊字符對目標的干擾程度。', style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeXS, fill: Theme.textMuted } });
    crowdDesc.x = Theme.paddingL; crowdDesc.y = 32;
    this.crowdingContainer.addChild(crowdDesc);
    const crowdTypes = ['無', '兩側橫棒', '包圍方框', '包圍圓圈', '相鄰字符', '兩側字符', '完整包圍'];
    const curCrowd = getSetting('crowdingType');
    const crowdTypeLabel = new Text({ text: `擠壓類型: ${crowdTypes[curCrowd]}`, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600', fill: Theme.accent } });
    crowdTypeLabel.x = Theme.paddingL; crowdTypeLabel.y = 70;
    this.crowdingContainer.addChild(crowdTypeLabel);
    const crowdCycleBtn = new Button({ label: '切換類型', width: 100, height: 32, fontSize: Theme.fontSizeS, variant: 'secondary', onClick: () => {
      setSetting('crowdingType', ((getSetting('crowdingType') + 1) % 7) as any);
      this.buildCrowdingTab();
    }});
    crowdCycleBtn.x = cardW - Theme.paddingL - 100; crowdCycleBtn.y = 66;
    this.crowdingContainer.addChild(crowdCycleBtn);
    const distTypes = ['2.6 bar-widths (DIN)', '1 個字符', '0.5 個字符', '緊貼'];
    const curDist = getSetting('crowdingDistanceType');
    const crowdDistLabel = new Text({ text: `擠壓間距: ${distTypes[curDist]}`, style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600', fill: Theme.accent } });
    crowdDistLabel.x = Theme.paddingL; crowdDistLabel.y = 120;
    this.crowdingContainer.addChild(crowdDistLabel);
    const distCycleBtn = new Button({ label: '切換間距', width: 100, height: 32, fontSize: Theme.fontSizeS, variant: 'secondary', onClick: () => {
      setSetting('crowdingDistanceType', ((getSetting('crowdingDistanceType') + 1) % 4) as any);
      this.buildCrowdingTab();
    }});
    distCycleBtn.x = cardW - Theme.paddingL - 100; distCycleBtn.y = 116;
    this.crowdingContainer.addChild(distCycleBtn);
  }

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
