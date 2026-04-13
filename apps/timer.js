import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('timer');

export default function render(container) {
    container.innerHTML = `
        <div class="timer-app">
            <div class="ta-header">
                <span class="ta-icon">⏱️</span>
                <div>
                    <h3>Stopky / Časovač</h3>
                    <p>Měř čas nebo nastav odpočet</p>
                </div>
            </div>

            <!-- Přepínání režimů -->
            <div class="ta-modes">
                <button data-mode="stopwatch" class="ta-mode-btn active">⏱️ Stopky</button>
                <button data-mode="timer" class="ta-mode-btn">⏲️ Časovač</button>
            </div>

            <!-- Zobrazení času -->
            <div class="ta-display" id="ta-display">
                00:00:00.000
            </div>

            <!-- Ovládací tlačítka -->
            <div class="ta-controls">
                <button id="ta-start" class="ta-control-btn ta-start">▶ Start</button>
                <button id="ta-pause" class="ta-control-btn ta-pause" disabled>⏸ Pauza</button>
                <button id="ta-reset" class="ta-control-btn ta-reset">🔄 Reset</button>
            </div>

            <!-- Nastavení časovače (viditelné jen v režimu časovač) -->
            <div id="ta-timer-settings" class="ta-section" style="display: none;">
                <label class="ta-label">⏲️ Nastavení časovače</label>
                <div class="ta-timer-inputs">
                    <div class="ta-time-input">
                        <input type="number" id="ta-hours" class="ta-input" value="0" min="0" max="23" step="1">
                        <span>hod</span>
                    </div>
                    <div class="ta-time-input">
                        <input type="number" id="ta-minutes" class="ta-input" value="1" min="0" max="59" step="1">
                        <span>min</span>
                    </div>
                    <div class="ta-time-input">
                        <input type="number" id="ta-seconds" class="ta-input" value="0" min="0" max="59" step="1">
                        <span>sec</span>
                    </div>
                </div>
                <button id="ta-set-timer" class="ta-set-btn">⏲️ Nastavit časovač</button>
            </div>

            <!-- Kolečka (laps) -->
            <div class="ta-laps-section">
                <div class="ta-laps-header">
                    <span>📋 Kolečka / Mezičasy</span>
                    <button id="ta-lap" class="ta-small-btn" disabled>⏱️ Kolečko</button>
                    <button id="ta-clear-laps" class="ta-small-btn" disabled>🗑️ Smazat</button>
                </div>
                <div id="ta-laps-list" class="ta-laps-list">
                    <div class="ta-empty-laps">Žádná kolečka</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="ta-tip">
                💡 <strong>Tip:</strong> U stopek můžeš ukládat mezičasy (kolečka). U časovače se po dočítání spustí zvukové upozornění.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const modeBtns = document.querySelectorAll('.ta-mode-btn');
    const displayEl = document.getElementById('ta-display');
    const startBtn = document.getElementById('ta-start');
    const pauseBtn = document.getElementById('ta-pause');
    const resetBtn = document.getElementById('ta-reset');
    const lapBtn = document.getElementById('ta-lap');
    const clearLapsBtn = document.getElementById('ta-clear-laps');
    const timerSettings = document.getElementById('ta-timer-settings');
    const hoursInput = document.getElementById('ta-hours');
    const minutesInput = document.getElementById('ta-minutes');
    const secondsInput = document.getElementById('ta-seconds');
    const setTimerBtn = document.getElementById('ta-set-timer');
    const lapsList = document.getElementById('ta-laps-list');

    let mode = 'stopwatch'; // 'stopwatch' or 'timer'
    let isRunning = false;
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let laps = [];
    let timerTarget = 0; // v milisekundách

    // Formátování času
    function formatTime(ms, showMs = true) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        
        if (showMs) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Aktualizace displeje
    function updateDisplay() {
        if (mode === 'stopwatch') {
            displayEl.textContent = formatTime(elapsedTime, true);
        } else {
            const remaining = Math.max(0, timerTarget - elapsedTime);
            displayEl.textContent = formatTime(remaining, false);
            
            // Kontrola konce časovače
            if (isRunning && remaining <= 0) {
                stopTimer();
                displayEl.textContent = formatTime(0, false);
                showNotification('⏰ Čas vypršel!', 'success');
                // Zvukové upozornění (volitelné)
                playBeep();
            }
        }
    }

    function playBeep() {
        // Jednoduchý beep pomocí Web Audio API
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 880;
            gainNode.gain.value = 0.3;
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1);
            oscillator.stop(audioCtx.currentTime + 1);
        } catch (e) {
            // Fallback - žádný zvuk
        }
    }

    // Hlavní timer interval
    function tick() {
        if (isRunning) {
            const now = Date.now();
            elapsedTime = (mode === 'stopwatch') ? (now - startTime) : (now - startTime);
            updateDisplay();
        }
    }

    function startTimer() {
        if (isRunning) return;
        
        if (mode === 'timer' && timerTarget <= 0) {
            showNotification('Nejprve nastav časovač', 'warning');
            return;
        }
        
        isRunning = true;
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(tick, 10);
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        lapBtn.disabled = (mode === 'stopwatch') ? false : true;
        clearLapsBtn.disabled = (mode === 'stopwatch' && laps.length > 0) ? false : true;
        
        saveState();
    }

    function pauseTimer() {
        if (!isRunning) return;
        
        isRunning = false;
        clearInterval(timerInterval);
        timerInterval = null;
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        saveState();
    }

    function stopTimer() {
        isRunning = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        lapBtn.disabled = true;
        
        saveState();
    }

    function resetTimer() {
        const wasRunning = isRunning;
        if (wasRunning) {
            pauseTimer();
        }
        
        if (mode === 'stopwatch') {
            elapsedTime = 0;
            laps = [];
            updateDisplay();
            displayLaps();
        } else {
            elapsedTime = 0;
            updateDisplay();
        }
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        lapBtn.disabled = (mode === 'stopwatch') ? false : true;
        clearLapsBtn.disabled = true;
        
        if (wasRunning) {
            startTimer();
        }
        
        saveState();
        showNotification('Resetováno');
    }

    function addLap() {
        if (mode !== 'stopwatch') return;
        
        const lapTime = elapsedTime;
        const lapNumber = laps.length + 1;
        const lastLapTime = laps.length > 0 ? laps[laps.length - 1].time : 0;
        const lapDifference = lapTime - lastLapTime;
        
        laps.push({
            number: lapNumber,
            time: lapTime,
            difference: lapDifference
        });
        
        displayLaps();
        clearLapsBtn.disabled = false;
        saveState();
        showNotification(`Kolečko ${lapNumber}: ${formatTime(lapTime, false)}`);
    }

    function displayLaps() {
        if (laps.length === 0) {
            lapsList.innerHTML = '<div class="ta-empty-laps">Žádná kolečka</div>';
            return;
        }
        
        lapsList.innerHTML = laps.map(lap => `
            <div class="ta-lap-item">
                <span class="ta-lap-num">#${lap.number}</span>
                <span class="ta-lap-time">${formatTime(lap.time, false)}</span>
                <span class="ta-lap-diff">${lap.difference > 0 ? '+' : ''}${formatTime(lap.difference, false)}</span>
            </div>
        `).join('');
        
        // Scroll na začátek
        lapsList.scrollTop = 0;
    }

    function clearLaps() {
        if (laps.length === 0) return;
        
        laps = [];
        displayLaps();
        clearLapsBtn.disabled = true;
        saveState();
        showNotification('Kolečka smazána');
    }

    // Časovač - nastavení
    function setTimer() {
        if (mode !== 'timer') return;
        
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        
        timerTarget = (hours * 3600 + minutes * 60 + seconds) * 1000;
        
        if (timerTarget <= 0) {
            showNotification('Zadej platný čas', 'warning');
            return;
        }
        
        const wasRunning = isRunning;
        if (wasRunning) pauseTimer();
        
        elapsedTime = 0;
        updateDisplay();
        
        if (wasRunning) startTimer();
        
        saveState();
        showNotification(`Časovač nastaven na ${formatTime(timerTarget, false)}`);
    }

    // Přepínání režimů
    function switchMode(newMode) {
        const wasRunning = isRunning;
        if (wasRunning) pauseTimer();
        
        mode = newMode;
        
        modeBtns.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        if (mode === 'stopwatch') {
            timerSettings.style.display = 'none';
            lapBtn.disabled = isRunning ? false : true;
            // Uložený čas stopek
            const savedElapsed = storage.get('stopwatchTime', 0);
            elapsedTime = savedElapsed;
            updateDisplay();
        } else {
            timerSettings.style.display = 'block';
            lapBtn.disabled = true;
            // Uložený čas časovače
            const savedTarget = storage.get('timerTarget', 60000);
            const savedElapsed = storage.get('timerElapsed', 0);
            timerTarget = savedTarget;
            elapsedTime = savedElapsed;
            updateDisplay();
            
            // Nastavení inputů
            const hours = Math.floor(timerTarget / 3600000);
            const minutes = Math.floor((timerTarget % 3600000) / 60000);
            const seconds = Math.floor((timerTarget % 60000) / 1000);
            hoursInput.value = hours;
            minutesInput.value = minutes;
            secondsInput.value = seconds;
        }
        
        clearLapsBtn.disabled = (mode === 'stopwatch' && laps.length > 0) ? false : true;
        
        saveState();
    }

    // Ukládání stavu
    function saveState() {
        if (mode === 'stopwatch') {
            storage.set('stopwatchTime', elapsedTime);
            storage.set('stopwatchLaps', laps);
        } else {
            storage.set('timerTarget', timerTarget);
            storage.set('timerElapsed', elapsedTime);
        }
        storage.set('mode', mode);
        storage.set('isRunning', isRunning);
    }

    // Načítání stavu
    function loadState() {
        const savedMode = storage.get('mode', 'stopwatch');
        const savedIsRunning = storage.get('isRunning', false);
        
        if (savedMode === 'stopwatch') {
            const savedTime = storage.get('stopwatchTime', 0);
            const savedLaps = storage.get('stopwatchLaps', []);
            elapsedTime = savedTime;
            laps = savedLaps;
            displayLaps();
        } else {
            const savedTarget = storage.get('timerTarget', 60000);
            const savedElapsed = storage.get('timerElapsed', 0);
            timerTarget = savedTarget;
            elapsedTime = savedElapsed;
            
            const hours = Math.floor(timerTarget / 3600000);
            const minutes = Math.floor((timerTarget % 3600000) / 60000);
            const seconds = Math.floor((timerTarget % 60000) / 1000);
            hoursInput.value = hours;
            minutesInput.value = minutes;
            secondsInput.value = seconds;
        }
        
        switchMode(savedMode);
        updateDisplay();
        
        if (savedIsRunning) {
            startTimer();
        }
    }

    // Eventy
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    lapBtn.addEventListener('click', addLap);
    clearLapsBtn.addEventListener('click', clearLaps);
    setTimerBtn.addEventListener('click', setTimer);
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchMode(btn.dataset.mode);
        });
    });
    
    // Enter na inputech
    hoursInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setTimer();
    });
    minutesInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setTimer();
    });
    secondsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setTimer();
    });
    
    // Ukládání při změně inputů
    hoursInput.addEventListener('change', saveState);
    minutesInput.addEventListener('change', saveState);
    secondsInput.addEventListener('change', saveState);
    
    loadState();
}

export function cleanup() {
    console.log('Timer App se zavírá');
}