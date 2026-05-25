# Task List: WebGazer AOI Analysis for Oculomotor Training

- [x] Add `oculomotorEnableWebgazer` to `src/utils/settings.ts` and translations (`zh.ts`, `en.ts`).
- [x] Add WebGazer toggle to `src/pages/SettingsPage.tsx` (or HomePage).
- [x] Update `src/experiment/timeline.ts` to prepend WebGazer init/calibrate plugins if enabled.
- [x] Update `src/pages/ExperimentPage.tsx` to include `WebGazerExtension` in `initJsPsych` if enabled, and show the new AOI score on the results screen and export in CSV.
- [x] Update `src/experiment/plugins/pixi-oculomotor-training.ts` to implement the 5-degree AOI scoring and 17s/3s intermittent center-cross calibration state machine.
- [x] Verify functionality (build).
