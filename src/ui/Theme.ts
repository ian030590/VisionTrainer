/**
 * Design tokens and theme constants for the ReadingTrainer UI.
 * Dark scientific theme inspired by FrACT10's clinical aesthetic.
 */
export const Theme = {
  // ── Backgrounds ──
  bg:           0x0D1117,
  bgPanel:      0x161B22,
  bgCard:       0x21262D,
  bgCardHover:  0x282E36,

  // ── Accent Colors ──
  accent:       0x58A6FF,
  accentDark:   0x388BFD,
  accentHover:  0x79C0FF,

  // ── Feedback ──
  success:      0x3FB950,
  error:        0xF85149,
  warning:      0xD29922,

  // ── Text ──
  textPrimary:  0xF0F6FC,
  textSecondary:0x8B949E,
  textMuted:    0x484F58,

  // ── Borders ──
  border:       0x30363D,
  borderHover:  0x484F58,

  // ── Calibration ──
  calibrationBox: 0x58A6FF,

  // ── Typography ──
  fontFamily: 'Inter, Noto Sans TC, sans-serif',
  fontSizeXS: 10,
  fontSizeS:  12,
  fontSizeM:  14,
  fontSizeL:  18,
  fontSizeXL: 24,
  fontSize2XL:32,
  fontSize3XL:48,

  // ── Spacing ──
  paddingS:  8,
  paddingM:  16,
  paddingL:  24,
  paddingXL: 32,

  // ── Radii ──
  radiusS:  4,
  radiusM:  8,
  radiusL:  12,
  radiusXL: 16,

  // ── Animation ──
  transitionFast: 150,
  transitionNormal: 300,
  transitionSlow: 500,
} as const;

/** Convert a hex number to a CSS color string */
export function hexToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
