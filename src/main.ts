/**
 * ReadingTrainer — Application Entry Point
 * TypeScript + PixiJS v8
 *
 * Initializes the PixiJS application, registers all scenes and training modules,
 * and starts on the main menu.
 */
import { Application } from 'pixi.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './core/Globals';
import { SceneManager } from './core/SceneManager';
import { MainMenuScene } from './scenes/MainMenuScene';
import { TrainingListScene } from './scenes/TrainingListScene';
import { SettingsScene } from './scenes/SettingsScene';
import { TrainingRegistry } from './trainings/TrainingRegistry';
import { PeripheralVisionModule } from './trainings/PeripheralVisionModule';
import { Theme } from './ui/Theme';

async function bootstrap(): Promise<void> {
  // ── Create PixiJS Application ──
  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundColor: Theme.bg,
    antialias: true,
    resolution: Math.max(window.devicePixelRatio || 1, 2.5),
    autoDensity: true,
  });

  // Append canvas to DOM
  const container = document.getElementById('app-container');
  if (container) {
    container.appendChild(app.canvas as HTMLCanvasElement);
  }

  // ── Scene Manager ──
  const sm = new SceneManager(app);

  // ── Register Training Modules ──
  // (Future modules: simply create a new XxxModule class and register here)
  const peripheralVision = new PeripheralVisionModule();
  peripheralVision.setGoBack(() => sm.goTo('trainingList'));
  TrainingRegistry.register(peripheralVision);

  // ── Register Scenes ──
  sm.register('mainMenu', new MainMenuScene(sm));
  sm.register('trainingList', new TrainingListScene(sm));
  sm.register('settings', new SettingsScene(sm));

  // ── Start ──
  await sm.goTo('mainMenu');
}

bootstrap().catch(console.error);
