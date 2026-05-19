/**
 * Scene interface and SceneManager.
 * Manages scene lifecycle and transitions, inspired by FrACT10's panel system.
 */
import { Container, Application } from 'pixi.js';

/** Interface that every scene must implement */
export interface Scene {
  /** The PixiJS container for this scene */
  readonly container: Container;
  /** Called when the scene becomes active */
  onEnter(): void | Promise<void>;
  /** Called every frame while active */
  onUpdate?(dt: number): void;
  /** Called when the scene is about to leave */
  onExit(): void;
  /** Called when the window resizes */
  onResize?(width: number, height: number): void;
}

/** Manages scene transitions */
export class SceneManager {
  private app: Application;
  private currentScene: Scene | null = null;
  private scenes = new Map<string, Scene>();

  constructor(app: Application) {
    this.app = app;
    // tick update
    this.app.ticker.add((ticker) => {
      if (this.currentScene?.onUpdate) {
        this.currentScene.onUpdate(ticker.deltaTime);
      }
    });
    // resize
    this.app.renderer.on('resize', () => this.handleResize());
  }

  /** Register a scene by name */
  register(name: string, scene: Scene): void {
    this.scenes.set(name, scene);
  }

  /** Switch to a named scene */
  async goTo(name: string): Promise<void> {
    const next = this.scenes.get(name);
    if (!next) {
      console.error(`Scene "${name}" not found`);
      return;
    }
    // exit current
    if (this.currentScene) {
      this.currentScene.onExit();
      this.app.stage.removeChild(this.currentScene.container);
    }
    // enter next
    this.currentScene = next;
    this.app.stage.addChild(next.container);
    await next.onEnter();
    // immediate resize to fit
    this.handleResize();
  }

  /** Get current scene name */
  getCurrentSceneName(): string | null {
    for (const [name, scene] of this.scenes) {
      if (scene === this.currentScene) return name;
    }
    return null;
  }

  private handleResize(): void {
    if (this.currentScene?.onResize) {
      this.currentScene.onResize(this.app.screen.width, this.app.screen.height);
    }
  }
}
