import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('metronome');

export default function render(container) {
    container.innerHTML = `
        <div class="metronome">
            <div class="mt-header">
                <span class="mt-icon">🎵</span>
                <div>
                    <h3>Metronom</h3>
                    <p>Udržuj tempo pomocí pravidelného tikání</p>
                </div>
            </div>

            <!-- BPM zobrazení -->
            <div class="mt-bpm-display">
                <span class="mt-bpm-value" id="mt-bpm-value">120</span>
                <span class="mt-bpm-label">BPM</span>
            </div>

            <!-- Ovládání BPM -->
            <div class="mt-section">
                <label class="mt-label">🎵 Tempo (BPM)</label>
                <div class="mt-bpm-control">
                    <button id="mt-bpm-minus" class="mt-bpm-btn">−</button>
                    <input type="range" id="mt-bpm-slider" class="mt-slider" min="40" max="240" value="120" step="1">
                    <button id="mt-bpm-plus" class="mt-bpm-btn">+</button>
                </div>
                <div class="mt-bpm-presets">
                    <button data-bpm="60" class="mt-preset">Largo (60)</button>
                    <button data-bpm="80" class="mt-preset">Andante (80)</button>
                    <button data-bpm="120" class="mt-preset active">Moderato (120)</button>
                    <button data-bpm="140" class="mt-preset">Allegro (140)</button>
                    <button data-bpm="180" class="mt-preset">Presto (180)</button>
                </div>
            </div>

            <!-- Takt -->
            <div class="mt-section">
                <label class="mt-label">📊 Takt</label>
                <div class="mt-time-signature">
                    <select id="mt-beats" class="mt-select">
                        <option value="2">2/4</option>
                        <option value="3">3/4</option>
                        <option value="4" selected>4/4</option>
                        <option value="6">6/8</option>
                    </select>
                </div>
                <div class="mt-hint">První doba je zvýrazněná</div>
            </div>

            <!-- Ovládání -->
            <div class="mt-controls">
                <button id="mt-start" class="mt-btn mt-btn-primary">▶ Start</button>
                <button id="mt-stop" class="mt-btn mt-btn-secondary" disabled>⏹ Stop</button>
                <button id="mt-tap" class="mt-btn mt-btn-secondary">👆 Tap tempo</button>
            </div>

            <!-- Vizuální metronom -->
            <div class="mt-visual">
                <div class="mt-light" id="mt-light"></div>
                <div class="mt-beat-indicator" id="mt-beat-indicator">
                    <span class="mt-beat">●</span>
                    <span class="mt-beat">●</span>
                    <span class="mt-beat">●</span>
                    <span class="mt-beat">●</span>
                </div>
            </div>

            <!-- Hlasitost -->
            <div class="mt-section">
                <label class="mt-label">🔊 Hlasitost</label>
                <div class="mt-volume-control">
                    <span>🔈</span>
                    <input type="range" id="mt-volume" class="mt-slider" min="0" max="100" value="70">
                    <span>🔊</span>
                </div>
            </div>

            <!-- Tip -->
            <div class="mt-tip">
                💡 <strong>Tip:</strong> Použij "Tap tempo" – klikni opakovaně na tlačítko v rytmu a metronom se nastaví na tvé tempo.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const bpmValueSpan = document.getElementById('mt-bpm-value');
    const bpmSlider = document.getElementById('mt-bpm-slider');
    const bpmMinus = document.getElementById('mt-bpm-minus');
    const bpmPlus = document.getElementById('mt-bpm-plus');
    const presetBtns = document.querySelectorAll('.mt-preset');
    const beatsSelect = document.getElementById('mt-beats');
    const startBtn = document.getElementById('mt-start');
    const stopBtn = document.getElementById('mt-stop');
    const tapBtn = document.getElementById('mt-tap');
    const volumeSlider = document.getElementById('mt-volume');
    const lightDiv = document.getElementById('mt-light');
    const beatIndicator = document.getElementById('mt-beat-indicator');

    let isRunning = false;
    let currentBpm = 120;
    let currentBeats = 4;
    let currentBeat = 0;
    let interval = null;
    let audioCtx = null;
    let tapTimes = [];
    let volume = 0.7;

    // Inicializace AudioContext
    function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Přehrání tiknutí
    function playTick(isFirst = false) {
        if (!audioCtx) return;
        
        // Obnovení AudioContext po uživatelské interakci
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // První doba (zvýrazněná) – vyšší frekvence
        if (isFirst) {
            oscillator.frequency.value = 880;
            gainNode.gain.value = volume * 0.5;
        } else {
            oscillator.frequency.value = 660;
            gainNode.gain.value = volume * 0.3;
        }
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
        oscillator.stop(audioCtx.currentTime + 0.2);
        
        // Vizuální efekt
        lightDiv.classList.add('active');
        setTimeout(() => {
            lightDiv.classList.remove('active');
        }, 100);
        
        // Aktualizace indikátoru doby
        updateBeatIndicator(currentBeat, isFirst);
    }

    function updateBeatIndicator(beat, isFirst) {
        const beats = beatIndicator.querySelectorAll('.mt-beat');
        beats.forEach((b, i) => {
            if (i === beat) {
                if (isFirst) {
                    b.classList.add('active-first');
                    b.classList.remove('active');
                } else {
                    b.classList.add('active');
                    b.classList.remove('active-first');
                }
            } else {
                b.classList.remove('active', 'active-first');
            }
        });
    }

    function resetBeatIndicator() {
        const beats = beatIndicator.querySelectorAll('.mt-beat');
        beats.forEach(b => {
            b.classList.remove('active', 'active-first');
        });
    }

    function startMetronome() {
        if (isRunning) return;
        
        initAudio();
        
        const intervalMs = (60 / currentBpm) * 1000;
        currentBeat = 0;
        resetBeatIndicator();
        
        // První tiknutí hned
        playTick(true);
        currentBeat = (currentBeat + 1) % currentBeats;
        
        interval = setInterval(() => {
            const isFirst = (currentBeat === 0);
            playTick(isFirst);
            currentBeat = (currentBeat + 1) % currentBeats;
        }, intervalMs);
        
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        saveSettings();
    }

    function stopMetronome() {
        if (!isRunning) return;
        
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
        
        isRunning = false;
        currentBeat = 0;
        resetBeatIndicator();
        lightDiv.classList.remove('active');
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        
        saveSettings();
    }

    function updateBpm(value) {
        currentBpm = Math.min(240, Math.max(40, parseInt(value) || 40));
        bpmValueSpan.textContent = currentBpm;
        bpmSlider.value = currentBpm;
        
        // Aktualizace preset tlačítek
        presetBtns.forEach(btn => {
            const btnBpm = parseInt(btn.dataset.bpm);
            if (btnBpm === currentBpm) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Restart metronomu pokud běží
        if (isRunning) {
            stopMetronome();
            startMetronome();
        }
        
        saveSettings();
    }

    // Tap tempo
    function tapTempo() {
        const now = Date.now();
        tapTimes.push(now);
        
        // Uchovat pouze posledních 5 časů
        if (tapTimes.length > 5) {
            tapTimes.shift();
        }
        
        if (tapTimes.length >= 2) {
            let total = 0;
            for (let i = 1; i < tapTimes.length; i++) {
                total += tapTimes[i] - tapTimes[i - 1];
            }
            const avgInterval = total / (tapTimes.length - 1);
            const bpm = Math.round(60000 / avgInterval);
            if (bpm >= 40 && bpm <= 240) {
                updateBpm(bpm);
                showNotification(`Tempo nastaveno na ${bpm} BPM`);
            }
        }
        
        // Časový limit pro reset (2 sekundy bez klepnutí)
        setTimeout(() => {
            if (tapTimes.length && Date.now() - tapTimes[tapTimes.length - 1] > 2000) {
                tapTimes = [];
            }
        }, 2000);
    }

    // Eventy
    bpmSlider.addEventListener('input', (e) => {
        updateBpm(e.target.value);
    });
    
    bpmMinus.addEventListener('click', () => {
        updateBpm(currentBpm - 1);
    });
    
    bpmPlus.addEventListener('click', () => {
        updateBpm(currentBpm + 1);
    });
    
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            updateBpm(parseInt(btn.dataset.bpm));
        });
    });
    
    beatsSelect.addEventListener('change', () => {
        currentBeats = parseInt(beatsSelect.value);
        // Aktualizace indikátoru
        const beatsHtml = Array(currentBeats).fill('<span class="mt-beat">●</span>').join('');
        beatIndicator.innerHTML = beatsHtml;
        resetBeatIndicator();
        
        if (isRunning) {
            stopMetronome();
            startMetronome();
        }
        saveSettings();
    });
    
    startBtn.addEventListener('click', startMetronome);
    stopBtn.addEventListener('click', stopMetronome);
    tapBtn.addEventListener('click', tapTempo);
    
    volumeSlider.addEventListener('input', (e) => {
        volume = parseInt(e.target.value) / 100;
        saveSettings();
    });
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('bpm', currentBpm);
        storage.set('beats', currentBeats);
        storage.set('volume', volume);
        storage.set('isRunning', isRunning);
    }
    
    function loadSettings() {
        currentBpm = storage.get('bpm', 120);
        currentBeats = storage.get('beats', 4);
        volume = storage.get('volume', 0.7);
        const savedIsRunning = storage.get('isRunning', false);
        
        bpmSlider.value = currentBpm;
        bpmValueSpan.textContent = currentBpm;
        beatsSelect.value = currentBeats;
        volumeSlider.value = volume * 100;
        
        // Aktualizace indikátoru
        const beatsHtml = Array(currentBeats).fill('<span class="mt-beat">●</span>').join('');
        beatIndicator.innerHTML = beatsHtml;
        
        // Aktualizace preset tlačítek
        presetBtns.forEach(btn => {
            const btnBpm = parseInt(btn.dataset.bpm);
            if (btnBpm === currentBpm) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Pokud byl metronom spuštěný, restartujeme
        if (savedIsRunning) {
            setTimeout(() => startMetronome(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
    console.log('Metronome se zavírá');
}