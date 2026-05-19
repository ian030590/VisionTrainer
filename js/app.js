/**
 * ReadingTrainer 應用程式核心邏輯
 */

document.addEventListener("DOMContentLoaded", () => {
    // 共用設定鍵名
    const STORAGE_KEY_DISTANCE = "reading_trainer_distance";
    const STORAGE_KEY_PIXEL_WIDTH = "reading_trainer_cal_box_width";

    // 實體卡片標準寬度 (mm)
    const CARD_WIDTH_MM = 85.6;
    const CARD_HEIGHT_MM = 53.98;
    const RATIO = CARD_HEIGHT_MM / CARD_WIDTH_MM; // 約 0.6306

    // --- 設定頁面邏輯 (settings.html) ---
    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) {
        const inputDistance = document.getElementById("viewing-distance");
        const sliderCalibration = document.getElementById("calibration-slider");
        const boxCalibration = document.getElementById("calibration-box");
        const displayDensity = document.getElementById("pixel-density-display");

        // 載入先前的設定
        const savedDistance = localStorage.getItem(STORAGE_KEY_DISTANCE);
        const savedBoxWidth = localStorage.getItem(STORAGE_KEY_PIXEL_WIDTH);

        if (savedDistance) {
            inputDistance.value = savedDistance;
        }

        if (savedBoxWidth) {
            sliderCalibration.value = savedBoxWidth;
        }

        // 即時更新校正方塊大小
        const updateBoxSize = () => {
            const currentWidth = parseFloat(sliderCalibration.value);
            const currentHeight = currentWidth * RATIO;
            
            boxCalibration.style.width = `${currentWidth}px`;
            boxCalibration.style.height = `${currentHeight}px`;

            // 計算 Pixels per mm
            const pxPerMm = (currentWidth / CARD_WIDTH_MM).toFixed(2);
            displayDensity.textContent = `${pxPerMm} px/mm`;
        };

        // 監聽滑桿變化
        sliderCalibration.addEventListener("input", updateBoxSize);
        // 初始化方塊大小
        updateBoxSize();

        // 儲存設定
        settingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            localStorage.setItem(STORAGE_KEY_DISTANCE, inputDistance.value);
            localStorage.setItem(STORAGE_KEY_PIXEL_WIDTH, sliderCalibration.value);
            
            alert("設定與校正已儲存！");
        });
    }

    // --- 訓練頁面邏輯 (training.html) ---
    const trainingContainer = document.getElementById("training-container");
    if (trainingContainer) {
        const infoDistance = document.getElementById("info-distance");
        const infoPpmm = document.getElementById("info-ppmm");
        const btnStart = document.getElementById("btn-start");
        const btnStop = document.getElementById("btn-stop");
        const trainingText = document.getElementById("training-text");

        // 讀取設定顯示
        const savedDistance = localStorage.getItem(STORAGE_KEY_DISTANCE) || "60";
        const savedBoxWidth = localStorage.getItem(STORAGE_KEY_PIXEL_WIDTH) || "250";
        
        infoDistance.textContent = `觀看距離: ${savedDistance} cm`;
        
        const pxPerMm = (parseFloat(savedBoxWidth) / CARD_WIDTH_MM).toFixed(2);
        infoPpmm.textContent = `Pixels/mm: ${pxPerMm}`;

        // 簡單的訓練開始/停止按鈕邏輯
        let trainingActive = false;

        btnStart.addEventListener("click", () => {
            trainingActive = true;
            btnStart.disabled = true;
            btnStop.disabled = false;
            trainingText.textContent = "訓練進行中...（此處將會顯示實際的訓練內容）";
            trainingText.style.color = "var(--accent)";
        });

        btnStop.addEventListener("click", () => {
            trainingActive = false;
            btnStart.disabled = false;
            btnStop.disabled = true;
            trainingText.textContent = "訓練已停止。請點擊「開始」重新進行。";
            trainingText.style.color = "var(--text-primary)";
        });
    }
});
