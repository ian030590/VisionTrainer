/**
 * Hand-drawn PixiJS Graphics icons to replace emoji usage.
 * Each function returns a Graphics object sized to fit within a given bounding box.
 */
import { Graphics } from 'pixi.js';
import { Theme } from './Theme';

/** Arrow pointing left (← back button icon) */
export function drawArrowLeft(size = 14, color = Theme.textPrimary): Graphics {
  const g = new Graphics();
  const s = size;
  // Arrowhead + shaft
  g.moveTo(s * 0.7, s * 0.15).lineTo(s * 0.2, s * 0.5).lineTo(s * 0.7, s * 0.85);
  g.moveTo(s * 0.2, s * 0.5).lineTo(s * 0.9, s * 0.5);
  g.stroke({ color, width: Math.max(1.5, s * 0.1) });
  return g;
}

/** Arrow pointing right (→ card navigation icon) */
export function drawArrowRight(size = 14, color = Theme.accent): Graphics {
  const g = new Graphics();
  const s = size;
  g.moveTo(s * 0.3, s * 0.15).lineTo(s * 0.8, s * 0.5).lineTo(s * 0.3, s * 0.85);
  g.moveTo(s * 0.1, s * 0.5).lineTo(s * 0.8, s * 0.5);
  g.stroke({ color, width: Math.max(1.5, s * 0.1) });
  return g;
}

/** Eye icon (👁️ training/vision) */
export function drawEye(size = 24, color = Theme.accent): Graphics {
  const g = new Graphics();
  const s = size;
  const cx = s / 2, cy = s / 2;
  const w2 = s * 0.42, h2 = s * 0.25;
  // Upper lid (quadratic bezier approx with arc)
  g.moveTo(cx - w2, cy);
  g.bezierCurveTo(cx - w2 * 0.5, cy - h2 * 1.6, cx + w2 * 0.5, cy - h2 * 1.6, cx + w2, cy);
  // Lower lid
  g.bezierCurveTo(cx + w2 * 0.5, cy + h2 * 1.6, cx - w2 * 0.5, cy + h2 * 1.6, cx - w2, cy);
  g.stroke({ color, width: Math.max(1.5, s * 0.07) });
  // Pupil
  g.circle(cx, cy, s * 0.1).fill({ color });
  // Iris ring
  g.circle(cx, cy, s * 0.18).stroke({ color, width: Math.max(1, s * 0.05) });
  return g;
}

/** Dumbbell / training icon (🏋️) */
export function drawDumbbell(size = 24, color = Theme.accent): Graphics {
  const g = new Graphics();
  const s = size;
  const cy = s / 2;
  const barY = cy;
  // Central bar
  g.moveTo(s * 0.25, barY).lineTo(s * 0.75, barY);
  g.stroke({ color, width: Math.max(2, s * 0.08) });
  // Left weight
  g.roundRect(s * 0.08, cy - s * 0.25, s * 0.14, s * 0.5, 2).fill({ color });
  // Right weight
  g.roundRect(s * 0.78, cy - s * 0.25, s * 0.14, s * 0.5, 2).fill({ color });
  // Left cap
  g.roundRect(s * 0.03, cy - s * 0.15, s * 0.08, s * 0.3, 1).fill({ color, alpha: 0.7 });
  // Right cap
  g.roundRect(s * 0.89, cy - s * 0.15, s * 0.08, s * 0.3, 1).fill({ color, alpha: 0.7 });
  return g;
}

/** Gear / settings icon (⚙️) */
export function drawGear(size = 24, color = Theme.accent): Graphics {
  const g = new Graphics();
  const s = size;
  const cx = s / 2, cy = s / 2;
  const outerR = s * 0.42;
  const innerR = s * 0.28;
  const teeth = 6;
  const toothWidth = Math.PI / (teeth * 2);

  // Build gear outline as a polygon
  const points: number[] = [];
  for (let i = 0; i < teeth; i++) {
    const baseAngle = (i / teeth) * Math.PI * 2 - Math.PI / 2;
    // Outer tooth
    points.push(cx + Math.cos(baseAngle - toothWidth) * outerR);
    points.push(cy + Math.sin(baseAngle - toothWidth) * outerR);
    points.push(cx + Math.cos(baseAngle + toothWidth) * outerR);
    points.push(cy + Math.sin(baseAngle + toothWidth) * outerR);
    // Inner valley
    const valleyAngle = baseAngle + Math.PI / teeth;
    points.push(cx + Math.cos(valleyAngle - toothWidth) * innerR);
    points.push(cy + Math.sin(valleyAngle - toothWidth) * innerR);
    points.push(cx + Math.cos(valleyAngle + toothWidth) * innerR);
    points.push(cy + Math.sin(valleyAngle + toothWidth) * innerR);
  }
  g.poly(points).fill({ color, alpha: 0.15 }).stroke({ color, width: Math.max(1.5, s * 0.06) });
  // Center hole
  g.circle(cx, cy, s * 0.12).fill({ color: Theme.bg }).stroke({ color, width: Math.max(1, s * 0.05) });
  return g;
}

/** Pencil / edit icon (✏️) */
export function drawPencil(size = 14, color = Theme.textPrimary): Graphics {
  const g = new Graphics();
  const s = size;
  // Pencil body (diagonal)
  g.moveTo(s * 0.75, s * 0.15).lineTo(s * 0.2, s * 0.7);
  g.lineTo(s * 0.12, s * 0.88).lineTo(s * 0.3, s * 0.8);
  g.lineTo(s * 0.85, s * 0.25);
  g.closePath();
  g.stroke({ color, width: Math.max(1.2, s * 0.07) });
  // Tip
  g.moveTo(s * 0.12, s * 0.88).lineTo(s * 0.2, s * 0.7).lineTo(s * 0.3, s * 0.8).closePath();
  g.fill({ color, alpha: 0.3 });
  return g;
}

/** Floppy disk / save icon (💾) */
export function drawSave(size = 18, color = Theme.textPrimary): Graphics {
  const g = new Graphics();
  const s = size;
  const m = s * 0.1;
  // Outer frame
  g.roundRect(m, m, s - m * 2, s - m * 2, s * 0.08).fill({ color, alpha: 0.12 }).stroke({ color, width: Math.max(1.5, s * 0.07) });
  // Top notch (the "label" area)
  g.rect(s * 0.25, m, s * 0.5, s * 0.3).fill({ color, alpha: 0.25 });
  // Center disk hole
  g.rect(s * 0.3, s * 0.55, s * 0.4, s * 0.3).fill({ color, alpha: 0.2 }).stroke({ color, width: Math.max(1, s * 0.05) });
  return g;
}

/** Checkmark icon (✓) */
export function drawCheck(size = 12, color = Theme.success): Graphics {
  const g = new Graphics();
  const s = size;
  g.moveTo(s * 0.15, s * 0.5).lineTo(s * 0.4, s * 0.8).lineTo(s * 0.85, s * 0.2);
  g.stroke({ color, width: Math.max(2, s * 0.15) });
  return g;
}

/** Cross / X icon (✗) */
export function drawCross(size = 12, color = Theme.error): Graphics {
  const g = new Graphics();
  const s = size;
  g.moveTo(s * 0.2, s * 0.2).lineTo(s * 0.8, s * 0.8);
  g.moveTo(s * 0.8, s * 0.2).lineTo(s * 0.2, s * 0.8);
  g.stroke({ color, width: Math.max(2, s * 0.15) });
  return g;
}

/** Warning triangle (⚠) */
export function drawWarning(size = 14, color = Theme.warning): Graphics {
  const g = new Graphics();
  const s = size;
  // Triangle
  g.moveTo(s * 0.5, s * 0.1).lineTo(s * 0.9, s * 0.85).lineTo(s * 0.1, s * 0.85).closePath();
  g.fill({ color, alpha: 0.15 }).stroke({ color, width: Math.max(1.5, s * 0.08) });
  // Exclamation mark
  g.moveTo(s * 0.5, s * 0.35).lineTo(s * 0.5, s * 0.6);
  g.stroke({ color, width: Math.max(2, s * 0.1) });
  g.circle(s * 0.5, s * 0.72, s * 0.04).fill({ color });
  return g;
}
