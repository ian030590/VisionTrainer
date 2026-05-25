# 加入 WebGazer 眼動追蹤分析至眼動訓練模組 (Oculomotor Training)

這個計畫將為「眼動訓練模組」加入基於 WebGazer 的注視點追蹤分析功能，能夠即時追蹤使用者的視線，並在測試期間計算視線落在目標周圍 5 度視角 (AOI) 的時間比例，最後產生百分制滿分 100 的成績。此外，也會加入每 17 秒進行 3 秒的中央十字校正機制，以防止 WebGazer 預測漂移。

## User Review Required

> [!IMPORTANT]
> **WebGazer 系統效能**
> 啟用 WebGazer 會佔用較多的 CPU 資源進行影像辨識。在低階設備上可能會導致遊戲幀數下降，建議您在測試時觀察是否會影響眼動訓練原本的平滑度。

> [!WARNING]
> **全螢幕與權限**
> WebGazer 需要相機存取權限。在進入測驗前，我們將會先安插 WebGazer 的攝影機初始化與九點校正畫面（使用 jsPsych 內建的 calibrate 模組），完成後才會進入真正的眼動訓練。

## Open Questions

> [!CAUTION]
> 請確認以下設計細節是否符合您的需求：
> 1. **設定開關**：我會在「設定」頁面中加入一個開關（預設為關閉），讓使用者可以選擇是否要在這輪測驗中開啟 WebGazer 分析，還是您希望它永遠開啟？
> 2. **AOI 的 5 度視角計算**：由於螢幕大小與觀看距離不同，5 度視角在不同螢幕上的像素大小會有差異。目前的設計會使用內部函數 `pixelFromDegree(5)` 來估算，大約會是 150~200 px 左右的半徑。
> 3. **每 17 秒的校正機制**：當觸發校正時，所有訓練目標都會消失，螢幕正中央會出現十字 3 秒。此時系統會在背景默默記錄使用者的視線資料到正中央，藉此即時修正 WebGazer 模型。這三秒將**不會**被計算在 AOI 的成績時間內，請問這樣是否可以？
> 4. **測驗結束成績顯示**：結算畫面與匯出的 CSV 紀錄中，都會新增一欄 `AOI 追蹤成績 (0-100分)`，分數越高代表視線越準確追隨目標。

## Proposed Changes

### `src/utils/settings.ts` & `src/pages/SettingsPage.tsx`
新增設定選項 `oculomotorEnableWebgazer`（布林值）。
讓使用者能在設定頁面的「眼動訓練」區塊切換是否開啟攝影機追蹤與評分功能。

---

### `src/experiment/timeline.ts`
在 `buildOculomotorTimeline` 中判斷 `oculomotorEnableWebgazer`。
若為 true，在 `PixiOculomotorTrainingPlugin` 之前安插 `@jspsych/plugin-webgazer-init-camera` 及 `@jspsych/plugin-webgazer-calibrate`，讓使用者在訓練開始前完成攝影機就緒與初步校正。

---

### `src/pages/ExperimentPage.tsx`
若 `oculomotorEnableWebgazer` 開啟，則在執行 `initJsPsych` 時必須傳入 `extensions: [{ type: WebGazerExtension }]`，註冊擴充功能，並將 AOI 的分數加入至測驗結算畫面及匯出的 CSV 檔案中。

---

### `src/experiment/plugins/pixi-oculomotor-training.ts`
修改核心 Plugin：
1. **加入參數**：`enable_webgazer` (布林值)。
2. **狀態機機制**：在 `tick` (每幀更新) 中加入 `training` 與 `calibration` 兩種狀態。
   - `training` 狀態：
     - 若距離上次校正已達 17 秒，切換至 `calibration` 狀態 3 秒。
     - 否則，取得最新目標物中心點。並讀取 `jsPsych.extensions.webgazer.getCurrentPrediction()`。
     - 若視線座標落在目標中心點往外推 5 度 (`pixelFromDegree(5)`) 半徑的圓形內，累加 AOI 時間。
   - `calibration` 狀態：
     - 隱藏所有訓練圖形與干擾物，顯示置中十字。
     - 透過呼叫 `webgazer.recordScreenPosition(cx, cy, 'click')` 來餵給 WebGazer 中心點的校正資料，修正漂移。
3. **成績輸出**：試驗結束時輸出 `aoi_score` (滿分 100 分)。

## Verification Plan

### Manual Verification
1. 開啟「眼動訓練 WebGazer 分析」設定。
2. 進入眼動追視測驗，會先要求鏡頭權限並進行校正。
3. 開始測驗，凝視移動的球，確認：
   - 測驗每進行 17 秒，畫面清空並顯示中央十字 3 秒。
   - 測驗結束後的結算畫面與下載的 CSV 顯示了 AOI 追蹤得分 (0-100)。
