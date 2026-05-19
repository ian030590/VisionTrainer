/**
 * Training Module Registry.
 * Central place to register and discover training modules.
 * Inspired by FrACT10 gTestRegistry.
 */
import type { TrainingModule } from './TrainingModule';

class TrainingRegistryImpl {
  private modules = new Map<string, TrainingModule>();

  /** Register a training module */
  register(mod: TrainingModule): void {
    if (this.modules.has(mod.meta.id)) {
      console.warn(`Training module "${mod.meta.id}" already registered, overwriting.`);
    }
    this.modules.set(mod.meta.id, mod);
  }

  /** Get a module by ID */
  get(id: string): TrainingModule | undefined {
    return this.modules.get(id);
  }

  /** Get all registered modules sorted by order */
  getAll(): TrainingModule[] {
    return [...this.modules.values()].sort((a, b) => a.meta.order - b.meta.order);
  }
}

export const TrainingRegistry = new TrainingRegistryImpl();
