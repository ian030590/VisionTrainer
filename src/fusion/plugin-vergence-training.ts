import { JsPsych, ParameterType } from 'jspsych';
import type { JsPsychPlugin, TrialType } from 'jspsych';
import { Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import { pixiAppManager } from '../utils/pixiPool';

const info = {
  name: 'vergence-training',
  version: '1.0.0',
  parameters: {
    base_offsetX: { type: ParameterType.INT, default: 0 },
    base_offsetY: { type: ParameterType.INT, default: 0 },
    shape_size: { type: ParameterType.INT, default: 100 },
    // speed in pixels per second
    separation_speed: { type: ParameterType.FLOAT, default: 10 },
    // maximum distance before automatically reversing
    max_separation: { type: ParameterType.INT, default: 150 },
    // Anti-suppression question interval (ms)
    suppression_check_interval: { type: ParameterType.INT, default: 5000 },
  },
  data: {
    break_distance: { type: ParameterType.FLOAT },
    recovery_distance: { type: ParameterType.FLOAT },
    suppression_answers: { type: ParameterType.COMPLEX }, // array of answers
  },
} as const;

type Info = typeof info;

class VergenceTrainingPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>): void {
    const self = this;
    
    let stageContainer: Container;
    let keyListener: (e: KeyboardEvent) => void;
    let uiContainer: HTMLDivElement;

    let currentSeparation = 0;
    let isExpanding = true;
    let breakDistance: number | null = null;
    let recoveryDistance: number | null = null;
    
    let isPausedForQuestion = false;
    const suppressionAnswers: any[] = [];
    
    // PixiJS elements
    let redShape: Graphics;
    let cyanShape: Graphics;
    let redText: Text;
    let cyanText: Text;
    let ticker: Ticker;

    pixiAppManager.ensureReady().then((app) => {
      pixiAppManager.attachTo(display_element);
      pixiAppManager.clearStage();

      stageContainer = new Container();
      app.stage.addChild(stageContainer);

      // Force Black Background for Anaglyph Contrast
      const bg = new Graphics();
      bg.rect(0, 0, app.screen.width, app.screen.height);
      bg.fill({ color: 0x000000 });
      stageContainer.addChild(bg);

      const cx = app.screen.width / 2;
      const cy = app.screen.height / 2;

      // Red Shape (Left Eye)
      redShape = new Graphics();
      redShape.circle(0, 0, trial.shape_size! / 2);
      redShape.fill({ color: 0xFF0000 });
      redShape.blendMode = 'add';
      
      const redStyle = new TextStyle({ fontSize: 36, fill: 0x000000, fontWeight: 'bold' });
      redText = new Text({ text: 'L', style: redStyle });
      redText.anchor.set(0.5);
      redShape.addChild(redText);
      
      // Cyan Shape (Right Eye)
      cyanShape = new Graphics();
      cyanShape.circle(0, 0, trial.shape_size! / 2);
      cyanShape.fill({ color: 0x00FFFF });
      cyanShape.blendMode = 'add';

      const cyanStyle = new TextStyle({ fontSize: 36, fill: 0x000000, fontWeight: 'bold' });
      cyanText = new Text({ text: 'R', style: cyanStyle });
      cyanText.anchor.set(0.5);
      cyanShape.addChild(cyanText);

      stageContainer.addChild(redShape);
      stageContainer.addChild(cyanShape);

      // UI Overlay
      uiContainer = document.createElement('div');
      uiContainer.style.position = 'absolute';
      uiContainer.style.top = '0';
      uiContainer.style.left = '0';
      uiContainer.style.width = '100%';
      uiContainer.style.height = '100%';
      uiContainer.style.pointerEvents = 'none';
      
      const instructions = document.createElement('div');
      instructions.style.position = 'absolute';
      instructions.style.bottom = '20px';
      instructions.style.width = '100%';
      instructions.style.textAlign = 'center';
      instructions.style.color = '#ffffff';
      instructions.style.fontSize = '20px';
      instructions.innerHTML = 'Focus on the shape.<br/>Press <b>B</b> when it BREAKS into two.<br/>Press <b>R</b> when it RECOVERS into one.';
      uiContainer.appendChild(instructions);

      const questionOverlay = document.createElement('div');
      questionOverlay.style.position = 'absolute';
      questionOverlay.style.top = '50%';
      questionOverlay.style.left = '50%';
      questionOverlay.style.transform = 'translate(-50%, -50%)';
      questionOverlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
      questionOverlay.style.padding = '20px';
      questionOverlay.style.borderRadius = '10px';
      questionOverlay.style.color = '#fff';
      questionOverlay.style.textAlign = 'center';
      questionOverlay.style.display = 'none';
      questionOverlay.innerHTML = `
        <h2>What letters do you see?</h2>
        <p>Press <b>1</b> for L only</p>
        <p>Press <b>2</b> for R only</p>
        <p>Press <b>3</b> for Both</p>
      `;
      uiContainer.appendChild(questionOverlay);

      display_element.appendChild(uiContainer);

      // Function to trigger suppression flash
      const flashEye = (eye: 'left' | 'right') => {
        let flashCount = 0;
        const targetShape = eye === 'left' ? redShape : cyanShape;
        const flashInterval = setInterval(() => {
          targetShape.alpha = targetShape.alpha === 1 ? 0.2 : 1;
          flashCount++;
          if (flashCount >= 20) { // 2 seconds at 10Hz
            clearInterval(flashInterval);
            targetShape.alpha = 1;
          }
        }, 100);
      };

      const finishTrial = () => {
        app.ticker.remove(tick);
        window.removeEventListener('keydown', keyListener);
        clearInterval(suppressionTimer);

        pixiAppManager.clearStage();
        if (uiContainer.parentNode) {
          uiContainer.parentNode.removeChild(uiContainer);
        }

        self.jsPsych.finishTrial({
          break_distance: breakDistance,
          recovery_distance: recoveryDistance,
          suppression_answers: suppressionAnswers,
        });
      };

      // Keyboard listener
      keyListener = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        
        if (isPausedForQuestion) {
          if (['1', '2', '3'].includes(key)) {
            suppressionAnswers.push({ distance: currentSeparation, answer: key });
            isPausedForQuestion = false;
            questionOverlay.style.display = 'none';

            if (key === '1') flashEye('right'); // Sees L, right is suppressed
            if (key === '2') flashEye('left');  // Sees R, left is suppressed
          }
          return;
        }

        if (key === 'b' && breakDistance === null) {
          breakDistance = currentSeparation;
          isExpanding = false; // start recovering
        } else if (key === 'r' && breakDistance !== null && recoveryDistance === null) {
          recoveryDistance = currentSeparation;
          finishTrial(); // End trial after recovery
        }
      };
      window.addEventListener('keydown', keyListener);

      // Animation Loop
      const tick = (tickerParams: Ticker) => {
        if (isPausedForQuestion) return;

        const deltaS = tickerParams.deltaMS / 1000;
        const speed = trial.separation_speed! * deltaS;

        if (isExpanding) {
          currentSeparation += speed;
          if (currentSeparation > trial.max_separation!) {
            currentSeparation = trial.max_separation!;
            // Force break if max reached
            if (breakDistance === null) {
              breakDistance = currentSeparation;
              isExpanding = false;
            }
          }
        } else {
          currentSeparation -= speed;
          if (currentSeparation < 0) {
            currentSeparation = 0;
            if (recoveryDistance === null) {
               // failed to recover
               recoveryDistance = 0;
               finishTrial();
            }
          }
        }

        // Apply separation relative to base calibration
        // Red moves left, Cyan moves right
        redShape.position.set(cx - currentSeparation / 2, cy);
        cyanShape.position.set(cx + trial.base_offsetX! + currentSeparation / 2, cy + trial.base_offsetY!);
      };

      app.ticker.add(tick);

      // Suppression check interval
      const suppressionTimer = setInterval(() => {
        if (!isPausedForQuestion) {
          isPausedForQuestion = true;
          questionOverlay.style.display = 'block';
        }
      }, trial.suppression_check_interval);

    });
  }
}

export default VergenceTrainingPlugin;
