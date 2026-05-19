/**
 * Simple sound manager for feedback sounds.
 * Inspired by FrACT10 SoundManager.j.
 */
import { getSetting } from './Settings';

class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private initialized = false;

  /** Must be called after a user interaction to unlock AudioContext */
  init(): void {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Play a short synthesized beep */
  playTone(frequency: number, durationMs: number, type: OscillatorType = 'sine'): void {
    if (!getSetting('auditoryFeedbackEnabled')) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const vol = getSetting('soundVolume') / 100;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = vol * 0.3;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
  }

  /** Correct answer feedback */
  playCorrect(): void {
    this.playTone(880, 150, 'sine');
  }

  /** Incorrect answer feedback */
  playIncorrect(): void {
    this.playTone(220, 250, 'square');
  }

  /** Run complete feedback */
  playRunEnd(): void {
    const ctx = this.ensureContext();
    if (!ctx || !getSetting('auditoryFeedbackEnabled')) return;
    const vol = getSetting('soundVolume') / 100;
    const now = ctx.currentTime;
    // Ascending 3-note arpeggio
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = vol * 0.25;
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 * (i + 1) + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.15 * i);
      osc.stop(now + 0.15 * (i + 1) + 0.2);
    });
  }
}

export const SoundManager = new SoundManagerImpl();
