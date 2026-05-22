import type { OculomotorMode, OculomotorPattern } from './types';

export const oculomotorModes: Array<{
  id: OculomotorMode;
  label: string;
  desc: string;
}> = [
  { id: 'pursuit', label: '追視', desc: '平滑追蹤' },
  { id: 'reaction-jumps', label: '跳視', desc: '快速定位' },
  { id: 'multi-object', label: '多目標', desc: '干擾追蹤' },
  { id: 'lilac-chaser', label: '周邊', desc: '中心固視' },
];

export const oculomotorPatterns: Array<{
  id: OculomotorPattern;
  label: string;
}> = [
  { id: 'randomWalk', label: '隨機路徑' },
  { id: 'circle', label: '圓形' },
  { id: 'figureEight', label: '8 字形' },
  { id: 'horizontalSweep', label: '水平掃視' },
  { id: 'verticalSweep', label: '垂直掃視' },
  { id: 'bounce', label: '反彈' },
  { id: 'diagonal', label: '斜向' },
  { id: 'spiralBloom', label: '螺旋' },
  { id: 'zigZag', label: '折線' },
];

export const isOculomotorMode = (value: string): value is OculomotorMode =>
  oculomotorModes.some((mode) => mode.id === value);

export const isOculomotorPattern = (value: string): value is OculomotorPattern =>
  oculomotorPatterns.some((pattern) => pattern.id === value);

export const getOculomotorModeLabel = (id: string) =>
  oculomotorModes.find((mode) => mode.id === id)?.label ?? id;

export const getOculomotorPatternLabel = (id: string) =>
  oculomotorPatterns.find((pattern) => pattern.id === id)?.label ?? id;
