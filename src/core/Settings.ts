/**
 * Settings manager with localStorage persistence.
 * Inspired by FrACT10 Settings.j — typed getter/setter with range validation.
 */
import {
  DEFAULT_DISTANCE_CM,
  DEFAULT_CAL_BAR_LENGTH_MM,
  CAL_BAR_LENGTH_PX,
  STORAGE_PREFIX,
} from './Globals';

/** Shape of all persisted settings */
export interface AppSettings {
  // ── Calibration ──
  distanceInCM: number;
  calBarLengthInMM: number;
  rulerLengthInMM: number;        // Ruler-based calibration (length of blue ruler in mm)

  // ── Display Calibration ──
  gammaValue: number;             // Monitor gamma (FrACT10 default 2.0)

  // ── Crowding ──
  crowdingType: number;           // 0=None, 1=Flanking bars, 2=Surrounding box, 3=Surrounding circle, 4=Adjacent optotypes, 5=Flanking optotypes, 6=Full surround
  crowdingDistanceType: number;   // 0=2.6 bar-widths, 1=1 optotype, 2=0.5 optotype, 3=abutting

  // ── Training defaults ──
  totalRounds: number;
  optionCount: number;
  optionMoveIntervalMs: number;
  targetPhysicalSizeMm: number;
  optionPhysicalSizeMm: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // ── Audio ──
  soundVolume: number;
  auditoryFeedbackEnabled: boolean;

  // ── System ──
  downloadDirectory: string;
}

/** Metadata for each setting: default, min, max */
interface SettingMeta<T> {
  dflt: T;
  min?: number;
  max?: number;
}

const META: { [K in keyof AppSettings]: SettingMeta<AppSettings[K]> } = {
  distanceInCM:           { dflt: DEFAULT_DISTANCE_CM,      min: 10,   max: 500 },
  calBarLengthInMM:       { dflt: DEFAULT_CAL_BAR_LENGTH_MM, min: 1,   max: 10000 },
  rulerLengthInMM:        { dflt: 0,    min: 0,    max: 10000 },
  gammaValue:             { dflt: 2.0,  min: 0.8,  max: 4.0 },
  crowdingType:           { dflt: 0,    min: 0,    max: 6 },
  crowdingDistanceType:   { dflt: 0,    min: 0,    max: 3 },
  totalRounds:            { dflt: 5,   min: 1,   max: 100 },
  optionCount:            { dflt: 18,  min: 4,   max: 40 },
  optionMoveIntervalMs:   { dflt: 800, min: 200, max: 5000 },
  targetPhysicalSizeMm:   { dflt: 15,  min: 2,   max: 100 },
  optionPhysicalSizeMm:   { dflt: 10,  min: 2,   max: 80 },
  difficulty:             { dflt: 'beginner' },
  soundVolume:            { dflt: 50,  min: 0,   max: 100 },
  auditoryFeedbackEnabled:{ dflt: true },
  downloadDirectory:      { dflt: '' },
};

function storageKey(name: string): string {
  return STORAGE_PREFIX + name;
}

/** Get a setting value, falling back to default */
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  const raw = localStorage.getItem(storageKey(key));
  if (raw === null) return META[key].dflt;

  const meta = META[key];
  if (typeof meta.dflt === 'boolean') {
    return (raw === 'true') as AppSettings[K];
  }
  if (typeof meta.dflt === 'number') {
    const num = parseFloat(raw);
    if (isNaN(num)) return meta.dflt;
    if (meta.min !== undefined && num < meta.min) return meta.dflt;
    if (meta.max !== undefined && num > meta.max) return meta.dflt;
    return num as AppSettings[K];
  }
  return raw as unknown as AppSettings[K];
}

/** Set a setting value */
export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  localStorage.setItem(storageKey(key), String(value));
}

/** Check if the device has been calibrated (distance AND bar differ from defaults) */
export function isCalibrated(): boolean {
  return (
    getSetting('distanceInCM') !== DEFAULT_DISTANCE_CM ||
    getSetting('calBarLengthInMM') !== DEFAULT_CAL_BAR_LENGTH_MM
  );
}

/** Reset all settings to defaults */
export function resetAllSettings(): void {
  for (const key of Object.keys(META) as (keyof AppSettings)[]) {
    setSetting(key, META[key].dflt);
  }
}

/** Pixels per millimeter derived from calibration */
export function getPixelsPerMM(): number {
  return CAL_BAR_LENGTH_PX / getSetting('calBarLengthInMM');
}

/** Millimeters per pixel */
export function getMMPerPixel(): number {
  return getSetting('calBarLengthInMM') / CAL_BAR_LENGTH_PX;
}

// ── Training History ──
export interface TrainingRecord {
  moduleName: string;
  timestamp: number;
  formattedText: string;
}

export function saveTrainingRecord(moduleName: string, formattedText: string): void {
  const records = getTodaysRecords();
  records.push({ moduleName, timestamp: Date.now(), formattedText });
  
  // Format Date as YYYY-MM-DD
  const dateStr = new Date().toISOString().split('T')[0];
  localStorage.setItem(`${STORAGE_PREFIX}history_${dateStr}`, JSON.stringify(records));
}

export function getTodaysRecords(): TrainingRecord[] {
  const dateStr = new Date().toISOString().split('T')[0];
  const raw = localStorage.getItem(`${STORAGE_PREFIX}history_${dateStr}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
