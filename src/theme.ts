/**
 * Design tokens for the VisualTrainer UI.
 * Dual-format: CSS strings for React, hex numbers for PixiJS.
 */

/** PixiJS hex color values */
export const pixiColors = {
  bg:           0x0D1117,
  bgPanel:      0x161B22,
  bgCard:       0x21262D,
  bgCardHover:  0x282E36,
  accent:       0x58A6FF,
  accentDark:   0x388BFD,
  accentHover:  0x79C0FF,
  success:      0x3FB950,
  error:        0xF85149,
  warning:      0xD29922,
  textPrimary:  0xF0F6FC,
  textSecondary:0x8B949E,
  textMuted:    0x484F58,
  border:       0x30363D,
  borderHover:  0x484F58,
  calibrationBox: 0x58A6FF,
} as const;

/** CSS color strings for React components */
export const cssColors = {
  bg:           '#0D1117',
  bgPanel:      '#161B22',
  bgCard:       '#21262D',
  bgCardHover:  '#282E36',
  accent:       '#58A6FF',
  accentDark:   '#388BFD',
  accentHover:  '#79C0FF',
  success:      '#3FB950',
  error:        '#F85149',
  warning:      '#D29922',
  textPrimary:  '#F0F6FC',
  textSecondary:'#8B949E',
  textMuted:    '#484F58',
  border:       '#30363D',
  borderHover:  '#484F58',
} as const;

/** Typography tokens */
export const typography = {
  fontFamily: "'Inter', 'Noto Sans TC', sans-serif",
  fontSizeXS: 10,
  fontSizeS:  12,
  fontSizeM:  14,
  fontSizeL:  18,
  fontSizeXL: 24,
  fontSize2XL:32,
  fontSize3XL:48,
} as const;

/** Spacing tokens */
export const spacing = {
  paddingS:  8,
  paddingM:  16,
  paddingL:  24,
  paddingXL: 32,
} as const;

/** Border radius tokens */
export const radii = {
  radiusS:  4,
  radiusM:  8,
  radiusL:  12,
  radiusXL: 16,
} as const;

/** Convert a hex number to a CSS color string */
export function hexToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
