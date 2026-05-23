/**
 * Design tokens for the Vision Trainer UI.
 * Dual-format: CSS strings for React, hex numbers for PixiJS.
 * Based on Clarity Rehabilitation Design System.
 */

/** PixiJS hex color values */
export const pixiColors = {
  bg:           0xF2F4F3, // Warm Gray
  bgPanel:      0xF9F9FC, // Surface
  bgCard:       0xFFFFFF, // White
  bgCardHover:  0xF9F9FC, // Surface
  accent:       0x005EB8, // Medical Blue
  accentDark:   0x00478D, // Primary
  accentHover:  0x005DB6, // Surface Tint
  success:      0x8BA88E, // Soft Sage
  error:        0xBA1A1A,
  warning:      0xD29922,
  textPrimary:  0x1A1C1E, // On-surface
  textSecondary:0x424752, // On-surface-variant
  textMuted:    0x727783, // Outline
  border:       0xC2C6D4, // Outline-variant
  borderHover:  0x727783, // Outline
  calibrationBox: 0x005EB8,
} as const;

/** CSS color strings for React components */
export const cssColors = {
  bg:           '#F2F4F3',
  bgPanel:      '#F9F9FC',
  bgCard:       '#FFFFFF',
  bgCardHover:  '#F9F9FC',
  accent:       '#005EB8',
  accentDark:   '#00478D',
  accentHover:  '#005DB6',
  success:      '#8BA88E',
  error:        '#BA1A1A',
  warning:      '#D29922',
  textPrimary:  '#1A1C1E',
  textSecondary:'#424752',
  textMuted:    '#727783',
  border:       '#C2C6D4',
  borderHover:  '#727783',
} as const;

/** Typography tokens */
export const typography = {
  fontFamily: "'Inter', 'Noto Sans TC', sans-serif",
  fontSizeXS: 12,
  fontSizeS:  14,
  fontSizeM:  16,
  fontSizeL:  18, // New base body size
  fontSizeXL: 24,
  fontSize2XL:32,
  fontSize3XL:48,
} as const;

/** Spacing tokens */
export const spacing = {
  paddingS:  8,
  paddingM:  16,
  paddingL:  24,
  paddingXL: 48, // stack-lg
} as const;

/** Border radius tokens */
export const radii = {
  radiusS:  4,
  radiusM:  8,  // standard elements
  radiusL:  16, // cards and primary buttons
  radiusXL: 24,
} as const;

/** Convert a hex number to a CSS color string */
export function hexToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
