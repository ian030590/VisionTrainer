/**
 * Eye Training Core Logic
 * Ported from reference/eye-training (Vue/Nuxt) to Vanilla JS.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Only run if we are on the eye-training page
    const gameArea = document.getElementById("game-area");
    if (!gameArea) return;

    // --- State & Settings ---
    const settings = {
        totalRounds: 5,
        optionsGridRows: 4,
        optionsGridCols: 5,
        optionCount: 18,
        optionMoveIntervalMs: 800,
        targetPhysicalSizeMm: 15, // Height of target in mm
        optionPhysicalSizeMm: 10,  // Height of options in mm
    };

    const state = {
        gameState: 'idle', // 'idle', 'playing', 'gameover'
        score: 0,
        currentRound: 0,
        currentTarget: '',
        currentOptions: [],
        occupiedCells: new Set(),
        optionMoveTimerId: null,
        isFeedbackActive: false
    };

    // --- Calibration Setup ---
    const STORAGE_KEY_PIXEL_WIDTH = "reading_trainer_cal_box_width";
    const CARD_WIDTH_MM = 85.6;
    let pxPerMm = 1; // Default fallback

    const savedBoxWidth = localStorage.getItem(STORAGE_KEY_PIXEL_WIDTH);
    if (savedBoxWidth) {
        pxPerMm = parseFloat(savedBoxWidth) / CARD_WIDTH_MM;
    }

    // Apply physical size to CSS variables
    document.documentElement.style.setProperty('--target-font-size', `${settings.targetPhysicalSizeMm * pxPerMm}px`);
    document.documentElement.style.setProperty('--option-font-size', `${settings.optionPhysicalSizeMm * pxPerMm}px`);

    // --- DOM Elements ---
    const domStateIdle = document.getElementById("state-idle");
    const domStatePlaying = document.getElementById("state-playing");
    const domStateGameOver = document.getElementById("state-gameover");
    
    const domTargetDisplay = document.getElementById("target-display");
    const domOptionsGrid = document.getElementById("options-grid");
    
    const domScore = document.getElementById("score");
    const domRound = document.getElementById("round");
    const domTotalRounds = document.getElementById("total-rounds");
    const domFinalScore = document.getElementById("final-score");
    
    const btnStart = document.getElementById("btn-start");
    const btnRestart = document.getElementById("btn-restart");

    domTotalRounds.textContent = settings.totalRounds;

    // --- Helper Functions ---
    function generateRandomLetters(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function switchState(newState) {
        state.gameState = newState;
        domStateIdle.classList.remove('active');
        domStatePlaying.classList.remove('active');
        domStateGameOver.classList.remove('active');

        if (newState === 'idle') domStateIdle.classList.add('active');
        else if (newState === 'playing') domStatePlaying.classList.add('active');
        else if (newState === 'gameover') domStateGameOver.classList.add('active');
    }

    function updateScoreboard() {
        domScore.textContent = state.score;
        domRound.textContent = state.currentRound;
        domFinalScore.textContent = state.score;
    }

    // --- Grid Logic ---
    function renderOptions() {
        domOptionsGrid.innerHTML = ''; // Clear grid

        // Set target text
        domTargetDisplay.textContent = state.currentTarget;
        domTargetDisplay.style.fontSize = `var(--target-font-size)`;

        const gridRect = domOptionsGrid.getBoundingClientRect();
        const cellWidth = (gridRect.width - 40) / settings.optionsGridCols; // 40px padding
        const cellHeight = (gridRect.height - 40) / settings.optionsGridRows;

        state.currentOptions.forEach(option => {
            const el = document.createElement("div");
            el.className = "eye-training-option";
            el.textContent = option.letters;
            el.style.fontSize = `var(--option-font-size)`;
            el.style.width = `${cellWidth * 0.8}px`; // Make it slightly smaller than cell
            el.style.height = `${cellHeight * 0.8}px`;
            
            // Calculate position
            const left = 20 + (option.gridCol * cellWidth) + (cellWidth * 0.1);
            const top = 20 + (option.gridRow * cellHeight) + (cellHeight * 0.1);
            
            el.style.left = `${left}px`;
            el.style.top = `${top}px`;

            el.addEventListener("click", () => handleOptionClick(option, el));

            domOptionsGrid.appendChild(el);
            option.element = el;
        });
    }

    // --- Game Logic ---
    function generateNewRound() {
        if (state.gameState === 'gameover') return;
        state.isFeedbackActive = false;

        const targetLength = 2;
        state.currentTarget = generateRandomLetters(targetLength);

        const distractors = new Set();
        while (distractors.size < settings.optionCount - 1) {
            const potentialDistractor = generateRandomLetters(targetLength);
            if (potentialDistractor !== state.currentTarget) {
                distractors.add(potentialDistractor);
            }
        }

        const newOptions = [];
        newOptions.push({
            letters: state.currentTarget,
            id: uuid.v4(),
            isCorrect: true
        });

        distractors.forEach(letters => {
            newOptions.push({
                letters: letters,
                id: uuid.v4(),
                isCorrect: false
            });
        });

        shuffleArray(newOptions);

        // Assign Grid
        state.occupiedCells.clear();
        const assignedOptions = [];
        let currentGridRow = 0;
        let currentGridCol = 0;

        for (const option of newOptions) {
            while (state.occupiedCells.has(`${currentGridRow}-${currentGridCol}`)) {
                currentGridCol++;
                if (currentGridCol >= settings.optionsGridCols) {
                    currentGridCol = 0;
                    currentGridRow++;
                }
            }

            if (currentGridRow < settings.optionsGridRows) {
                const positionKey = `${currentGridRow}-${currentGridCol}`;
                state.occupiedCells.add(positionKey);
                assignedOptions.push({
                    ...option,
                    gridRow: currentGridRow,
                    gridCol: currentGridCol
                });
            }
        }

        state.currentOptions = assignedOptions;
        state.currentRound++;
        
        updateScoreboard();
        renderOptions();
    }

    function moveRandomOption() {
        if (state.gameState !== 'playing' || state.currentOptions.length === 0) return;

        // Find empty cells
        const emptyCells = [];
        for (let r = 0; r < settings.optionsGridRows; r++) {
            for (let c = 0; c < settings.optionsGridCols; c++) {
                if (!state.occupiedCells.has(`${r}-${c}`)) {
                    emptyCells.push({ row: r, col: c });
                }
            }
        }

        if (emptyCells.length === 0) return;

        const optionIndexToMove = Math.floor(Math.random() * state.currentOptions.length);
        const optionToMove = state.currentOptions[optionIndexToMove];

        const targetCellIndex = Math.floor(Math.random() * emptyCells.length);
        const targetCell = emptyCells[targetCellIndex];

        // Update occupied set
        state.occupiedCells.delete(`${optionToMove.gridRow}-${optionToMove.gridCol}`);
        state.occupiedCells.add(`${targetCell.row}-${targetCell.col}`);

        // Update option data
        optionToMove.gridRow = targetCell.row;
        optionToMove.gridCol = targetCell.col;

        // Animate movement
        const gridRect = domOptionsGrid.getBoundingClientRect();
        const cellWidth = (gridRect.width - 40) / settings.optionsGridCols;
        const cellHeight = (gridRect.height - 40) / settings.optionsGridRows;

        const left = 20 + (optionToMove.gridCol * cellWidth) + (cellWidth * 0.1);
        const top = 20 + (optionToMove.gridRow * cellHeight) + (cellHeight * 0.1);

        if (optionToMove.element) {
            optionToMove.element.style.left = `${left}px`;
            optionToMove.element.style.top = `${top}px`;
        }
    }

    function startTimer() {
        if (state.optionMoveTimerId) clearInterval(state.optionMoveTimerId);
        state.optionMoveTimerId = setInterval(moveRandomOption, settings.optionMoveIntervalMs);
    }

    function stopTimer() {
        if (state.optionMoveTimerId) {
            clearInterval(state.optionMoveTimerId);
            state.optionMoveTimerId = null;
        }
    }

    function handleOptionClick(option, element) {
        if (state.isFeedbackActive || state.gameState !== 'playing') return;

        state.isFeedbackActive = true;
        
        if (option.isCorrect) {
            element.classList.add("feedback-correct");
            state.score += 10;
            
            if (state.currentRound >= settings.totalRounds) {
                setTimeout(() => {
                    endGame();
                }, 500);
            } else {
                setTimeout(() => {
                    generateNewRound();
                }, 500);
            }
        } else {
            element.classList.add("feedback-incorrect");
            setTimeout(() => {
                element.classList.remove("feedback-incorrect");
                state.isFeedbackActive = false;
            }, 500);
        }
        updateScoreboard();
    }

    function startGame() {
        state.score = 0;
        state.currentRound = 0;
        switchState('playing');
        generateNewRound();
        startTimer();
    }

    function endGame() {
        stopTimer();
        switchState('gameover');
        updateScoreboard();
    }

    // --- Listeners ---
    btnStart.addEventListener("click", startGame);
    btnRestart.addEventListener("click", startGame);

    // Initial resize to make sure grid cells are sized correctly
    window.addEventListener('resize', () => {
        if (state.gameState === 'playing') {
            renderOptions();
        }
    });
});
