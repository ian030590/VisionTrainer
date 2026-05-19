/**
 * Peripheral Vision Training Scene.
 * State machine: idle → playing → gameover.
 * Inspired by FrACT10's trial flow: trialStart → drawStimulus → waitResponse → trialEnd.
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Scene } from '../core/SceneManager';
import { Theme } from '../ui/Theme';
import { Button } from '../ui/Button';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../core/Globals';
import { getSetting } from '../core/Settings';
import { SoundManager } from '../core/SoundManager';
import { shuffleArray, generateRandomLetters } from '../utils/MathUtils';
import { pixelFromMillimeter } from '../utils/SpatialUtils';

type GameState = 'idle' | 'playing' | 'gameover';

interface GameOption {
  letters: string;
  isCorrect: boolean;
  gridRow: number;
  gridCol: number;
  container: Container;
}

export class PeripheralVisionScene implements Scene {
  readonly container = new Container();
  private goBack: () => void;

  // game state
  private gameState: GameState = 'idle';
  private score = 0;
  private currentRound = 0;
  private currentTarget = '';
  private options: GameOption[] = [];
  private occupiedCells = new Set<string>();
  private moveTimerId: ReturnType<typeof setInterval> | null = null;
  private feedbackActive = false;

  // layout
  private readonly gridRows = 4;
  private readonly gridCols = 5;
  private readonly optionCount = 18;

  // DOM containers
  private gameArea: Container | null = null;
  private scoreText: Text | null = null;
  private roundText: Text | null = null;

  // sub-state containers
  private stateIdle: Container | null = null;
  private statePlaying: Container | null = null;
  private stateGameover: Container | null = null;

  constructor(goBack: () => void) {
    this.goBack = goBack;
  }

  onEnter(): void {
    SoundManager.init();
    this.container.removeChildren();
    this.gameState = 'idle';
    this.score = 0;
    this.currentRound = 0;
    this.buildUI();
    this.switchState('idle');
  }

  onUpdate(_dt: number): void {}

  onExit(): void {
    this.stopMoveTimer();
  }

  // ═══════════════════════════════════════════════════════════
  //  UI Construction
  // ═══════════════════════════════════════════════════════════
  private buildUI(): void {
    // ── Background ──
    const bg = new Graphics();
    bg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bg.fill({ color: Theme.bg });
    this.container.addChild(bg);

    // ── Header ──
    const header = new Graphics();
    header.rect(0, 0, CANVAS_WIDTH, 56);
    header.fill({ color: Theme.bgPanel });
    header.rect(0, 55, CANVAS_WIDTH, 1);
    header.fill({ color: Theme.border });
    this.container.addChild(header);

    const headerTitle = new Text({
      text: '👁️  周邊視覺訓練',
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fontWeight: '700', fill: Theme.textPrimary },
    });
    headerTitle.x = Theme.paddingL;
    headerTitle.y = 16;
    this.container.addChild(headerTitle);

    const backBtn = new Button({
      label: '← 返回清單',
      width: 130, height: 36,
      fontSize: Theme.fontSizeS,
      variant: 'ghost',
      onClick: () => { this.stopMoveTimer(); this.goBack(); },
    });
    backBtn.x = CANVAS_WIDTH - 150;
    backBtn.y = 10;
    this.container.addChild(backBtn);

    // ── Score bar ──
    const totalRounds = getSetting('totalRounds');
    this.scoreText = new Text({
      text: `分數: 0`,
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fontWeight: '600', fill: Theme.textPrimary },
    });
    this.scoreText.x = Theme.paddingL;
    this.scoreText.y = 68;
    this.container.addChild(this.scoreText);

    this.roundText = new Text({
      text: `回合: 0 / ${totalRounds}`,
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textSecondary },
    });
    this.roundText.x = CANVAS_WIDTH - 180;
    this.roundText.y = 68;
    this.container.addChild(this.roundText);

    // ── Game area ──
    this.gameArea = new Container();
    this.gameArea.y = 95;
    this.container.addChild(this.gameArea);

    // ── State: Idle ──
    this.stateIdle = new Container();
    const startBtn = new Button({
      label: '開始訓練',
      width: 220, height: 56,
      fontSize: Theme.fontSizeXL,
      variant: 'primary',
      onClick: () => this.startGame(),
    });
    startBtn.x = (CANVAS_WIDTH - 220) / 2;
    startBtn.y = 200;
    this.stateIdle.addChild(startBtn);

    const idleHint = new Text({
      text: '在中央目標出現後，快速找到周圍相同的字母配對並點擊',
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textMuted, align: 'center' },
    });
    idleHint.anchor.set(0.5, 0);
    idleHint.x = CANVAS_WIDTH / 2;
    idleHint.y = 280;
    this.stateIdle.addChild(idleHint);
    this.gameArea.addChild(this.stateIdle);

    // ── State: Playing ──
    this.statePlaying = new Container();
    this.statePlaying.visible = false;
    this.gameArea.addChild(this.statePlaying);

    // ── State: Game Over ──
    this.stateGameover = new Container();
    this.stateGameover.visible = false;
    this.gameArea.addChild(this.stateGameover);
  }

  // ═══════════════════════════════════════════════════════════
  //  State Machine
  // ═══════════════════════════════════════════════════════════
  private switchState(state: GameState): void {
    this.gameState = state;
    if (this.stateIdle) this.stateIdle.visible = state === 'idle';
    if (this.statePlaying) this.statePlaying.visible = state === 'playing';
    if (this.stateGameover) this.stateGameover.visible = state === 'gameover';
  }

  // ═══════════════════════════════════════════════════════════
  //  Game Logic
  // ═══════════════════════════════════════════════════════════
  private startGame(): void {
    this.score = 0;
    this.currentRound = 0;
    this.switchState('playing');
    this.generateNewRound();
    this.startMoveTimer();
  }

  private generateNewRound(): void {
    if (this.gameState === 'gameover') return;
    this.feedbackActive = false;
    this.currentRound++;
    this.updateScoreboard();

    // clear playing area
    if (this.statePlaying) this.statePlaying.removeChildren();

    // generate target
    this.currentTarget = generateRandomLetters(2);

    // target display
    const targetSize = pixelFromMillimeter(getSetting('targetPhysicalSizeMm'));
    const targetText = new Text({
      text: this.currentTarget,
      style: {
        fontFamily: Theme.fontFamily,
        fontSize: Math.max(16, targetSize),
        fontWeight: '700',
        fill: Theme.accent,
        letterSpacing: 4,
      },
    });
    targetText.anchor.set(0.5);
    targetText.x = CANVAS_WIDTH / 2;
    targetText.y = 30;
    this.statePlaying!.addChild(targetText);

    // fixation cross
    const cross = new Graphics();
    cross.moveTo(CANVAS_WIDTH / 2 - 8, 70);
    cross.lineTo(CANVAS_WIDTH / 2 + 8, 70);
    cross.moveTo(CANVAS_WIDTH / 2, 62);
    cross.lineTo(CANVAS_WIDTH / 2, 78);
    cross.stroke({ color: Theme.textMuted, width: 2 });
    this.statePlaying!.addChild(cross);

    // grid area
    const gridX = 30;
    const gridY = 90;
    const gridW = CANVAS_WIDTH - 60;
    const gridH = CANVAS_HEIGHT - 95 - 110;

    // grid border
    const gridBorder = new Graphics();
    gridBorder.roundRect(gridX, gridY, gridW, gridH, Theme.radiusM);
    gridBorder.stroke({ color: Theme.border, width: 1 });
    this.statePlaying!.addChild(gridBorder);

    // generate options
    const distractors = new Set<string>();
    while (distractors.size < this.optionCount - 1) {
      const d = generateRandomLetters(2);
      if (d !== this.currentTarget) distractors.add(d);
    }

    const rawOptions: { letters: string; isCorrect: boolean }[] = [
      { letters: this.currentTarget, isCorrect: true },
    ];
    distractors.forEach((l) => rawOptions.push({ letters: l, isCorrect: false }));
    shuffleArray(rawOptions);

    // assign grid positions
    this.occupiedCells.clear();
    this.options = [];

    const cellW = gridW / this.gridCols;
    const cellH = gridH / this.gridRows;
    const optionFontSize = Math.max(12, pixelFromMillimeter(getSetting('optionPhysicalSizeMm')));

    let row = 0, col = 0;
    for (const opt of rawOptions) {
      while (this.occupiedCells.has(`${row}-${col}`)) {
        col++;
        if (col >= this.gridCols) { col = 0; row++; }
      }
      if (row >= this.gridRows) break;

      const key = `${row}-${col}`;
      this.occupiedCells.add(key);

      const optContainer = new Container();
      optContainer.eventMode = 'static';
      optContainer.cursor = 'pointer';

      // option background
      const optBg = new Graphics();
      const oW = cellW * 0.8;
      const oH = cellH * 0.8;
      optBg.roundRect(0, 0, oW, oH, Theme.radiusS);
      optBg.fill({ color: Theme.bgCard });
      optBg.roundRect(0, 0, oW, oH, Theme.radiusS);
      optBg.stroke({ color: Theme.border, width: 1 });
      optContainer.addChild(optBg);

      // option text
      const optText = new Text({
        text: opt.letters,
        style: {
          fontFamily: Theme.fontFamily,
          fontSize: optionFontSize,
          fontWeight: '600',
          fill: Theme.textPrimary,
        },
      });
      optText.anchor.set(0.5);
      optText.x = oW / 2;
      optText.y = oH / 2;
      optContainer.addChild(optText);

      // position
      const px = gridX + col * cellW + cellW * 0.1;
      const py = gridY + row * cellH + cellH * 0.1;
      optContainer.x = px;
      optContainer.y = py;

      const gameOpt: GameOption = {
        letters: opt.letters,
        isCorrect: opt.isCorrect,
        gridRow: row,
        gridCol: col,
        container: optContainer,
      };

      // hover
      optContainer.on('pointerover', () => {
        optBg.clear();
        optBg.roundRect(0, 0, oW, oH, Theme.radiusS);
        optBg.fill({ color: Theme.bgCardHover });
        optBg.roundRect(0, 0, oW, oH, Theme.radiusS);
        optBg.stroke({ color: Theme.accent, width: 2 });
      });
      optContainer.on('pointerout', () => {
        optBg.clear();
        optBg.roundRect(0, 0, oW, oH, Theme.radiusS);
        optBg.fill({ color: Theme.bgCard });
        optBg.roundRect(0, 0, oW, oH, Theme.radiusS);
        optBg.stroke({ color: Theme.border, width: 1 });
      });
      optContainer.on('pointertap', () => this.handleOptionClick(gameOpt, optBg, oW, oH));

      this.options.push(gameOpt);
      this.statePlaying!.addChild(optContainer);

      col++;
      if (col >= this.gridCols) { col = 0; row++; }
    }
  }

  private handleOptionClick(opt: GameOption, bg: Graphics, w: number, h: number): void {
    if (this.feedbackActive || this.gameState !== 'playing') return;
    this.feedbackActive = true;

    if (opt.isCorrect) {
      // correct feedback
      bg.clear();
      bg.roundRect(0, 0, w, h, Theme.radiusS);
      bg.fill({ color: 0x1A3D2B });
      bg.roundRect(0, 0, w, h, Theme.radiusS);
      bg.stroke({ color: Theme.success, width: 2 });
      SoundManager.playCorrect();
      this.score += 10;
      this.updateScoreboard();

      const totalRounds = getSetting('totalRounds');
      setTimeout(() => {
        if (this.currentRound >= totalRounds) {
          this.endGame();
        } else {
          this.generateNewRound();
        }
      }, 400);
    } else {
      // incorrect feedback
      bg.clear();
      bg.roundRect(0, 0, w, h, Theme.radiusS);
      bg.fill({ color: 0x3D1A1A });
      bg.roundRect(0, 0, w, h, Theme.radiusS);
      bg.stroke({ color: Theme.error, width: 2 });
      SoundManager.playIncorrect();

      setTimeout(() => {
        bg.clear();
        bg.roundRect(0, 0, w, h, Theme.radiusS);
        bg.fill({ color: Theme.bgCard });
        bg.roundRect(0, 0, w, h, Theme.radiusS);
        bg.stroke({ color: Theme.border, width: 1 });
        this.feedbackActive = false;
      }, 400);
    }
  }

  private moveRandomOption(): void {
    if (this.gameState !== 'playing' || this.options.length === 0) return;

    // find empty cells
    const emptyCells: { row: number; col: number }[] = [];
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (!this.occupiedCells.has(`${r}-${c}`)) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }
    if (emptyCells.length === 0) return;

    const optIdx = Math.floor(Math.random() * this.options.length);
    const opt = this.options[optIdx];
    const targetCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    // update grid
    this.occupiedCells.delete(`${opt.gridRow}-${opt.gridCol}`);
    this.occupiedCells.add(`${targetCell.row}-${targetCell.col}`);
    opt.gridRow = targetCell.row;
    opt.gridCol = targetCell.col;

    // animate
    const gridX = 30;
    const gridY = 90;
    const gridW = CANVAS_WIDTH - 60;
    const gridH = CANVAS_HEIGHT - 95 - 110;
    const cellW = gridW / this.gridCols;
    const cellH = gridH / this.gridRows;

    const newX = gridX + opt.gridCol * cellW + cellW * 0.1;
    const newY = gridY + opt.gridRow * cellH + cellH * 0.1;

    // simple smooth move using ticker
    const startX = opt.container.x;
    const startY = opt.container.y;
    const duration = 300; // ms
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      opt.container.x = startX + (newX - startX) * ease;
      opt.container.y = startY + (newY - startY) * ease;
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  private startMoveTimer(): void {
    this.stopMoveTimer();
    const interval = getSetting('optionMoveIntervalMs');
    this.moveTimerId = setInterval(() => this.moveRandomOption(), interval);
  }

  private stopMoveTimer(): void {
    if (this.moveTimerId) {
      clearInterval(this.moveTimerId);
      this.moveTimerId = null;
    }
  }

  private endGame(): void {
    this.stopMoveTimer();
    this.switchState('gameover');
    SoundManager.playRunEnd();

    if (!this.stateGameover) return;
    this.stateGameover.removeChildren();

    // results display
    const resultTitle = new Text({
      text: '訓練結束！',
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSize2XL, fontWeight: '700', fill: Theme.textPrimary },
    });
    resultTitle.anchor.set(0.5);
    resultTitle.x = CANVAS_WIDTH / 2;
    resultTitle.y = 140;
    this.stateGameover.addChild(resultTitle);

    const scoreDisplay = new Text({
      text: `${this.score}`,
      style: { fontFamily: Theme.fontFamily, fontSize: 72, fontWeight: '700', fill: Theme.accent },
    });
    scoreDisplay.anchor.set(0.5);
    scoreDisplay.x = CANVAS_WIDTH / 2;
    scoreDisplay.y = 220;
    this.stateGameover.addChild(scoreDisplay);

    const scoreLabel = new Text({
      text: '總分',
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeL, fill: Theme.textSecondary },
    });
    scoreLabel.anchor.set(0.5);
    scoreLabel.x = CANVAS_WIDTH / 2;
    scoreLabel.y = 270;
    this.stateGameover.addChild(scoreLabel);

    const totalRounds = getSetting('totalRounds');
    const accuracy = totalRounds > 0 ? Math.round((this.score / (totalRounds * 10)) * 100) : 0;
    const accText = new Text({
      text: `正確率: ${accuracy}%  |  回合: ${this.currentRound} / ${totalRounds}`,
      style: { fontFamily: Theme.fontFamily, fontSize: Theme.fontSizeM, fill: Theme.textMuted },
    });
    accText.anchor.set(0.5);
    accText.x = CANVAS_WIDTH / 2;
    accText.y = 310;
    this.stateGameover.addChild(accText);

    const restartBtn = new Button({
      label: '重新開始',
      width: 180, height: 48,
      fontSize: Theme.fontSizeL,
      variant: 'primary',
      onClick: () => this.startGame(),
    });
    restartBtn.x = (CANVAS_WIDTH - 180) / 2;
    restartBtn.y = 360;
    this.stateGameover.addChild(restartBtn);

    const backBtn = new Button({
      label: '返回清單',
      width: 180, height: 48,
      fontSize: Theme.fontSizeL,
      variant: 'secondary',
      onClick: () => this.goBack(),
    });
    backBtn.x = (CANVAS_WIDTH - 180) / 2;
    backBtn.y = 420;
    this.stateGameover.addChild(backBtn);
  }

  private updateScoreboard(): void {
    const totalRounds = getSetting('totalRounds');
    if (this.scoreText) this.scoreText.text = `分數: ${this.score}`;
    if (this.roundText) this.roundText.text = `回合: ${this.currentRound} / ${totalRounds}`;
  }
}
