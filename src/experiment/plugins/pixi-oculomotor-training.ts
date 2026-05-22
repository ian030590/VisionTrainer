/**
 * jsPsych Custom Plugin: pixi-oculomotor-training
 *
 * PixiJS recreation of the FoveaFlow-style continuous eye movement trainer.
 * A single jsPsych trial is one timed training session.
 */
import { JsPsych, ParameterType } from 'jspsych';
import type { JsPsychPlugin, TrialType } from 'jspsych';
import { Application, Graphics, Text } from 'pixi.js';
import { pixiColors, typography } from '../../theme';
import { pixiAppManager } from '../../utils/pixiPool';
import { createRng } from '../../oculomotor/random';
import { sampleOculomotorPatternInto } from '../../oculomotor/patterns';
import type { Arena, OculomotorMode, OculomotorPattern, TargetFrame } from '../../oculomotor/types';
import { getOculomotorModeLabel, getOculomotorPatternLabel } from '../../oculomotor/presets';

const info = {
  name: 'pixi-oculomotor-training',
  version: '1.0.0',
  parameters: {
    mode: {
      type: ParameterType.STRING,
      default: 'pursuit',
    },
    pattern: {
      type: ParameterType.STRING,
      default: 'randomWalk',
    },
    duration_ms: {
      type: ParameterType.INT,
      default: 60_000,
    },
    speed_px_per_sec: {
      type: ParameterType.FLOAT,
      default: 260,
    },
    target_radius_px: {
      type: ParameterType.FLOAT,
      default: 26,
    },
    distractor_count: {
      type: ParameterType.INT,
      default: 5,
    },
    round_number: {
      type: ParameterType.INT,
      default: 1,
    },
    total_rounds: {
      type: ParameterType.INT,
      default: 1,
    },
  },
  data: {
    rt: { type: ParameterType.INT },
    correct: { type: ParameterType.BOOL },
    target: { type: ParameterType.STRING },
    response: { type: ParameterType.STRING },
    mode: { type: ParameterType.STRING },
    pattern: { type: ParameterType.STRING },
    acquired_targets: { type: ParameterType.INT },
    average_fps: { type: ParameterType.FLOAT },
    duration_ms: { type: ParameterType.INT },
  },
} as const;

type Info = typeof info;

const LILAC_DOT_COUNT = 12;
const FULL_CIRCLE = Math.PI * 2;

const modeTitle: Record<OculomotorMode, string> = {
  pursuit: '眼動訓練 · 追視',
  'reaction-jumps': '眼動訓練 · 跳視',
  'multi-object': '眼動訓練 · 多目標追蹤',
  'lilac-chaser': '眼動訓練 · 周邊固視',
};

const drawTargetShape = (
  gfx: Graphics,
  frame: TargetFrame,
  isReactionFlash: boolean,
) => {
  const outer = frame.radiusPx;
  const inner = Math.max(2, outer * 0.42);
  const ringColor = frame.role === 'target' ? 0xffffff : pixiColors.borderHover;

  gfx
    .circle(frame.x, frame.y, outer)
    .fill({ color: frame.color, alpha: frame.alpha })
    .circle(frame.x, frame.y, inner)
    .fill({ color: pixiColors.bg, alpha: frame.role === 'target' ? 0.18 : 0.45 });

  if (frame.role === 'target') {
    gfx.circle(frame.x, frame.y, outer).stroke({
      color: isReactionFlash ? pixiColors.success : ringColor,
      width: isReactionFlash ? 4 : 2,
      alpha: 0.88,
    });
  }
};

class PixiOculomotorTrainingPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>): void {
    const self = this;
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;overflow:hidden;';
    display_element.innerHTML = '';
    display_element.appendChild(wrapper);

    const mode = trial.mode as OculomotorMode;
    const pattern = trial.pattern as OculomotorPattern;
    const durationMs = Math.max(5_000, trial.duration_ms as number);
    const speedPxPerSec = Math.max(20, trial.speed_px_per_sec as number);
    const radiusPx = Math.max(6, trial.target_radius_px as number);
    const distractorCount = Math.max(0, trial.distractor_count as number);
    const rng = createRng(Math.floor(Math.random() * 2_147_483_646) + 1);
    const manager = pixiAppManager;

    let ended = false;
    let paused = false;
    let pauseStartedAt = 0;
    let pausedMs = 0;
    let acquiredTargets = 0;
    let frameCount = 0;
    let fpsAccumulator = 0;
    let lastFpsTimestamp = performance.now();
    let flashUntil = 0;

    const runWithApp = (app: Application) => {
      manager.clearStage();
      manager.attachTo(wrapper);

      const startTime = performance.now();
      const bgGfx = new Graphics();
      const guideGfx = new Graphics();
      const targetGfx = new Graphics();
      const hudGfx = new Graphics();
      const lilacGfx = new Graphics();
      const titleText = new Text();
      const metaText = new Text();
      const timeText = new Text();
      const pauseText = new Text();
      const exitText = new Text();
      const reactionLetter = new Text();
      const frames: TargetFrame[] = [];

      let latestTarget: TargetFrame | null = null;

      app.stage.addChild(bgGfx, guideGfx, lilacGfx, targetGfx, reactionLetter, hudGfx, titleText, metaText, timeText, pauseText, exitText);

      titleText.style = {
        fontFamily: typography.fontFamily,
        fontSize: typography.fontSizeL,
        fontWeight: '700',
        fill: pixiColors.textPrimary,
      };
      metaText.style = {
        fontFamily: typography.fontFamily,
        fontSize: typography.fontSizeS,
        fill: pixiColors.textSecondary,
      };
      timeText.style = {
        fontFamily: typography.fontFamily,
        fontSize: typography.fontSizeM,
        fontWeight: '700',
        fill: pixiColors.accentHover,
      };
      pauseText.style = {
        fontFamily: typography.fontFamily,
        fontSize: typography.fontSizeS,
        fontWeight: '700',
        fill: pixiColors.textPrimary,
      };
      exitText.style = pauseText.style;
      reactionLetter.style = {
        fontFamily: typography.fontFamily,
        fontSize: Math.max(18, radiusPx * 0.92),
        fontWeight: '800',
        fill: pixiColors.bg,
      };
      reactionLetter.anchor.set(0.5);

      titleText.text = modeTitle[mode] ?? '眼動訓練';
      metaText.text = mode === 'lilac-chaser'
        ? 'Lilac Chaser'
        : `${getOculomotorModeLabel(mode)} · ${getOculomotorPatternLabel(pattern)}`;

      const getArena = (): Arena => ({
        width: Math.max(1, app.screen.width),
        height: Math.max(1, app.screen.height),
      });

      const getElapsedMs = () => {
        const now = performance.now();
        const activePause = paused ? now - pauseStartedAt : 0;
        return Math.max(0, now - startTime - pausedMs - activePause);
      };

      const getElapsedSec = () => getElapsedMs() / 1000;

      const drawHud = (remainingMs: number) => {
        const w = app.screen.width;
        const h = app.screen.height;
        const hudHeight = Math.max(58, Math.min(72, h * 0.09));
        const buttonY = hudHeight / 2 - 15;

        hudGfx
          .clear()
          .rect(0, 0, w, hudHeight)
          .fill({ color: pixiColors.bgPanel, alpha: 0.94 })
          .rect(0, hudHeight - 1, w, 1)
          .fill({ color: pixiColors.border });

        hudGfx
          .roundRect(w - 168, buttonY, 72, 30, 6)
          .fill({ color: paused ? pixiColors.accentDark : pixiColors.bgCard })
          .stroke({ color: pixiColors.border, width: 1 })
          .roundRect(w - 84, buttonY, 60, 30, 6)
          .fill({ color: pixiColors.bgCard })
          .stroke({ color: pixiColors.border, width: 1 });

        titleText.x = 24;
        titleText.y = Math.max(10, hudHeight * 0.18);
        metaText.x = 24;
        metaText.y = titleText.y + 26;

        timeText.text = `${Math.ceil(remainingMs / 1000)}s`;
        timeText.x = Math.max(180, w - 238);
        timeText.y = hudHeight / 2 - 10;

        pauseText.text = paused ? '繼續' : '暫停';
        pauseText.x = w - 146;
        pauseText.y = hudHeight / 2 - 9;

        exitText.text = '結束';
        exitText.x = w - 66;
        exitText.y = hudHeight / 2 - 9;
      };

      const drawGuides = (arena: Arena, hudHeight: number) => {
        const cx = arena.width / 2;
        const cy = (arena.height + hudHeight) / 2;

        guideGfx.clear();

        if (mode === 'lilac-chaser') {
          guideGfx
            .rect(0, 0, arena.width, arena.height)
            .fill({ color: 0xd8d8da })
            .moveTo(cx - 14, cy)
            .lineTo(cx + 14, cy)
            .moveTo(cx, cy - 14)
            .lineTo(cx, cy + 14)
            .stroke({ color: 0x050505, width: 3 });
          return;
        }

        guideGfx
          .moveTo(cx - 9, cy)
          .lineTo(cx + 9, cy)
          .moveTo(cx, cy - 9)
          .lineTo(cx, cy + 9)
          .stroke({ color: pixiColors.textMuted, width: 2, alpha: 0.8 });

        const step = 72;
        for (let x = step; x < arena.width; x += step) {
          guideGfx.moveTo(x, hudHeight).lineTo(x, arena.height);
        }
        for (let y = hudHeight + step; y < arena.height; y += step) {
          guideGfx.moveTo(0, y).lineTo(arena.width, y);
        }
        guideGfx.stroke({ color: pixiColors.border, width: 1, alpha: 0.26 });
      };

      const drawLilacChaser = (arena: Arena, elapsedSec: number) => {
        const hudHeight = Math.max(58, Math.min(72, arena.height * 0.09));
        const cx = arena.width / 2;
        const cy = (arena.height + hudHeight) / 2;
        const orbit = Math.min(arena.width, arena.height - hudHeight) * 0.31;
        const dotRadius = Math.max(8, orbit * 0.13);
        const hiddenIndex = Math.floor(elapsedSec * 10) % LILAC_DOT_COUNT;

        lilacGfx.clear();
        for (let i = 0; i < LILAC_DOT_COUNT; i += 1) {
          if (i === hiddenIndex) continue;
          const angle = -Math.PI / 2 + (i / LILAC_DOT_COUNT) * FULL_CIRCLE;
          lilacGfx
            .circle(cx + Math.cos(angle) * orbit, cy + Math.sin(angle) * orbit, dotRadius)
            .fill({ color: 0xff00fe, alpha: 0.86 });
        }
      };

      const finish = (response: string) => {
        if (ended) return;
        ended = true;
        app.ticker.remove(tick);
        app.renderer.off('resize', handleResize);
        app.stage.off('pointertap', handleStageTap);
        window.removeEventListener('keydown', handleKeydown);
        manager.clearStage();
        manager.detachCanvas();
        display_element.innerHTML = '';

        const elapsed = Math.min(durationMs, Math.round(getElapsedMs()));
        const averageFps = frameCount > 0 ? fpsAccumulator / frameCount : 0;

        self.jsPsych.finishTrial({
          rt: elapsed,
          correct: true,
          target: modeTitle[mode] ?? mode,
          response,
          mode,
          pattern,
          acquired_targets: acquiredTargets,
          average_fps: Math.round(averageFps * 10) / 10,
          duration_ms: elapsed,
        });
      };

      const togglePause = () => {
        if (ended) return;
        if (paused) {
          pausedMs += performance.now() - pauseStartedAt;
          paused = false;
          return;
        }
        pauseStartedAt = performance.now();
        paused = true;
      };

      const handleStageTap = (event: any) => {
        if (ended) return;
        const point = event.global;
        const w = app.screen.width;
        const hudHeight = Math.max(58, Math.min(72, app.screen.height * 0.09));

        if (point.y <= hudHeight) {
          if (point.x >= w - 168 && point.x <= w - 96) togglePause();
          if (point.x >= w - 84 && point.x <= w - 24) finish('手動結束');
          return;
        }

        if (paused || mode !== 'reaction-jumps' || !latestTarget) return;
        const dx = point.x - latestTarget.x;
        const dy = point.y - latestTarget.y;
        if (dx * dx + dy * dy <= Math.pow(latestTarget.radiusPx * 1.45, 2)) {
          acquiredTargets += 1;
          flashUntil = performance.now() + 140;
        }
      };

      const handleKeydown = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
          event.preventDefault();
          togglePause();
        }
        if (event.code === 'Escape') finish('手動結束');
      };

      const handleResize = () => draw();

      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      app.stage.on('pointertap', handleStageTap);
      window.addEventListener('keydown', handleKeydown);
      app.renderer.on('resize', handleResize);

      const draw = () => {
        const arena = getArena();
        const elapsedMs = getElapsedMs();
        const elapsedSec = elapsedMs / 1000;
        const remainingMs = Math.max(0, durationMs - elapsedMs);
        const hudHeight = Math.max(58, Math.min(72, arena.height * 0.09));

        bgGfx.clear().rect(0, 0, arena.width, arena.height).fill({
          color: mode === 'lilac-chaser' ? 0xd8d8da : pixiColors.bg,
        });
        drawGuides(arena, hudHeight);
        drawHud(remainingMs);

        targetGfx.clear();
        reactionLetter.visible = false;
        lilacGfx.visible = mode === 'lilac-chaser';

        if (mode === 'lilac-chaser') {
          drawLilacChaser(arena, elapsedSec);
          return;
        }

        const activePattern = mode === 'reaction-jumps'
          ? 'randomWalk'
          : mode === 'multi-object'
            ? 'randomWalk'
            : pattern;
        const jumpBucket = Math.floor(elapsedSec / 1.15);
        const travelPx = mode === 'reaction-jumps'
          ? jumpBucket * Math.max(260, Math.min(arena.width, arena.height) * 0.55)
          : elapsedSec * speedPxPerSec;
        const count = sampleOculomotorPatternInto(
          frames,
          activePattern,
          arena,
          {
            radiusPx,
            speedPxPerSec,
            travelPx,
            targetCount: 1,
            distractorCount: mode === 'multi-object' ? distractorCount : 0,
            colorA: mode === 'reaction-jumps' ? pixiColors.warning : pixiColors.success,
            colorB: pixiColors.accent,
          },
          rng,
        );

        latestTarget = frames[0] ?? null;
        const isReactionFlash = performance.now() < flashUntil;
        for (let i = 0; i < count; i += 1) {
          drawTargetShape(targetGfx, frames[i], isReactionFlash && i === 0);
        }

        if (mode === 'reaction-jumps' && latestTarget) {
          reactionLetter.text = String.fromCharCode(65 + (jumpBucket % 26));
          reactionLetter.x = latestTarget.x;
          reactionLetter.y = latestTarget.y;
          reactionLetter.visible = true;
        }
      };

      const tick = () => {
        const now = performance.now();
        const dt = now - lastFpsTimestamp;
        lastFpsTimestamp = now;
        if (dt > 0 && dt < 1000) {
          frameCount += 1;
          fpsAccumulator += 1000 / dt;
        }

        if (!paused) {
          draw();
          if (getElapsedMs() >= durationMs) finish('完成');
        } else {
          draw();
        }
      };

      draw();
      app.ticker.add(tick);
    };

    if (manager.ready) {
      runWithApp(manager.getApp()!);
    } else {
      manager.ensureReady().then(runWithApp).catch((err) => {
        console.error('PixiJS init failed:', err);
        display_element.innerHTML = `<div style="color:red;padding:20px;">PixiJS 初始化失敗: ${err.message}</div>`;
      });
    }
  }
}

export default PixiOculomotorTrainingPlugin;
