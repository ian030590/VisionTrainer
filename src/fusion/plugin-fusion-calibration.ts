import { JsPsych, ParameterType } from 'jspsych';
import type { JsPsychPlugin, TrialType } from 'jspsych';
import { Container, Graphics } from 'pixi.js';
import { pixiAppManager } from '../utils/pixiPool';

const info = {
  name: 'fusion-calibration',
  version: '1.0.0',
  parameters: {
    shape_size: {
      type: ParameterType.INT,
      default: 100,
    },
    step_size: {
      type: ParameterType.INT,
      default: 2,
    },
  },
  data: {
    offsetX: { type: ParameterType.INT },
    offsetY: { type: ParameterType.INT },
    rt: { type: ParameterType.INT },
  },
} as const;

type Info = typeof info;

class FusionCalibrationPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>): void {
    const self = this;
    const startTime = performance.now();
    let offsetX = 0;
    let offsetY = 0;
    
    // We will store our objects here to clean them up later
    let stageContainer: Container;
    let keyListener: (e: KeyboardEvent) => void;

    pixiAppManager.ensureReady().then((app) => {
      // Attach canvas to jsPsych display element
      pixiAppManager.attachTo(display_element);
      pixiAppManager.clearStage();

      stageContainer = new Container();
      app.stage.addChild(stageContainer);

      const cx = app.screen.width / 2;
      const cy = app.screen.height / 2;

      // Create Red Shape (Left Eye)
      const redShape = new Graphics();
      redShape.circle(0, 0, trial.shape_size! / 2);
      redShape.fill({ color: 0xFF0000 });
      redShape.position.set(cx, cy);
      // ADD blend mode for Red + Cyan = White
      redShape.blendMode = 'add';
      stageContainer.addChild(redShape);

      // Create Cyan Shape (Right Eye)
      const cyanShape = new Graphics();
      cyanShape.circle(0, 0, trial.shape_size! / 2);
      cyanShape.fill({ color: 0x00FFFF });
      cyanShape.position.set(cx, cy);
      cyanShape.blendMode = 'add';
      stageContainer.addChild(cyanShape);

      // Instructions Text
      const instructions = document.createElement('div');
      instructions.style.position = 'absolute';
      instructions.style.top = '20px';
      instructions.style.left = '0';
      instructions.style.width = '100%';
      instructions.style.textAlign = 'center';
      instructions.style.color = '#ffffff';
      instructions.style.fontSize = '20px';
      instructions.style.pointerEvents = 'none';
      instructions.innerHTML = 'Use Arrow Keys to align the circles until they form a single solid white circle.<br/>Press SPACEBAR when done.';
      display_element.appendChild(instructions);

      // Keyboard Handling
      keyListener = (e: KeyboardEvent) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault();
        }

        switch (e.key) {
          case 'ArrowUp':
            offsetY -= trial.step_size!;
            break;
          case 'ArrowDown':
            offsetY += trial.step_size!;
            break;
          case 'ArrowLeft':
            offsetX -= trial.step_size!;
            break;
          case 'ArrowRight':
            offsetX += trial.step_size!;
            break;
          case ' ':
            finishTrial();
            return;
        }

        cyanShape.position.set(cx + offsetX, cy + offsetY);
      };

      window.addEventListener('keydown', keyListener);

      const finishTrial = () => {
        window.removeEventListener('keydown', keyListener);
        const rt = Math.round(performance.now() - startTime);

        // Cleanup Pixi objects
        pixiAppManager.clearStage();
        if (instructions.parentNode) {
          instructions.parentNode.removeChild(instructions);
        }

        const trialData = {
          offsetX,
          offsetY,
          rt,
        };

        self.jsPsych.finishTrial(trialData);
      };
    });
  }
}

export default FusionCalibrationPlugin;
