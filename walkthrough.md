# 眼動訓練 WebGazer AOI 分析實作總結

我們已成功將 WebGazer 結合至「眼動訓練 (Oculomotor Training)」模組，提供實時眼動追蹤與準確度評分，並實作了背景校正機制。

## 主要完成項目

1. **設定與介面切換**
   - 新增 `oculomotorEnableWebgazer` 設定，並在首頁的眼動訓練設定面板中加入「啟用 WebGazer 分析」的開關。
   - 包含中英文完整語系支援。

2. **試驗流程 (Timeline) 更新**
   - 啟動訓練前，若該開關被啟用，系統將自動安插 `@jspsych/plugin-webgazer-init-camera` 及 `@jspsych/plugin-webgazer-calibrate`，確保使用者在開始訓練前完成相機權限授權與九點校正。
   - 在 `ExperimentPage.tsx` 初始化 jsPsych 時動態引入 `WebGazerExtension`。

3. **核心追蹤與校正邏輯**
   - 於 `pixi-oculomotor-training.ts` 內加入了即時追蹤狀態機。
   - 每幀計算預測視線座標是否落在距離目標物 5 度視角 (`pixelFromDegree(5)`) 以內的 **Area of Interest (AOI)**。
   - 實作了 **每 17 秒觸發一次、每次 3 秒** 的背景中央十字校正。在校正期間，訓練時鐘暫停 (`calibrationPausedMs`)，因此這 3 秒不僅不會算入追視計分中，也不會扣除總訓練時長，達成完全無縫的測試時長與校正流程。

4. **結果顯示與 CSV 匯出**
   - 在試驗結算畫面與匯出的 CSV 報告中，都會明確列出該次訓練的「AOI Score (0-100)」。分數為 `100 * (AOI內的時間 / 總追視時間)`。

## 如何測試
1. 在首頁選擇「眼動訓練」模組，展開設定面版。
2. 開啟下方的「啟用 WebGazer 分析」。
3. 點擊「開始訓練」，依序通過相機初始化與九宮格校正後，體驗加入了動態背景校正與準確度追蹤的眼動訓練。
