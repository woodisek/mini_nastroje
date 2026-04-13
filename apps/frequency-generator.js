import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('frequency-generator');

export default function render(container) {
    container.innerHTML = `
        <div class="frequency-generator">
            <div class="fg-header">
                <span class="fg-icon">🎵</span>
                <div>
                    <h3>Frequency Sound Generator</h3>
                    <p>Generuj tóny o různých frekvencích</p>
                </div>
            </div>

            <!-- Hlavní ovládání -->
            <div class="fg-section">
                <label class="fg-label">🎵 Frekvence (Hz)</label>
                <div class="fg-frequency-control">
                    <button id="fg-freq-minus" class="fg-freq-btn">−</button>
                    <input type="number" id="fg-frequency" class="fg-frequency-input" value="440" min="20" max="20000" step="1">
                    <button id="fg-freq-plus" class="fg-freq-btn">+</button>
                </div>
                <input type="range" id="fg-frequency-slider" class="fg-slider" min="20" max="20000" value="440" step="1">
                <div class="fg-frequency-presets">
                    <button data-freq="110" class="fg-preset">110 Hz (A2)</button>
                    <button data-freq="220" class="fg-preset">220 Hz (A3)</button>
                    <button data-freq="440" class="fg-preset active">440 Hz (A4)</button>
                    <button data-freq="880" class="fg-preset">880 Hz (A5)</button>
                    <button data-freq="1760" class="fg-preset">1760 Hz (A6)</button>
                </div>
            </div>

            <!-- Hlasitost -->
            <div class="fg-section">
                <label class="fg-label">🔊 Hlasitost</label>
                <div class="fg-volume-control">
                    <span>🔈</span>
                    <input type="range" id="fg-volume" class="fg-slider" min="0" max="100" value="50">
                    <span>🔊</span>
                </div>
                <div class="fg-volume-value" id="fg-volume-value">50%</div>
            </div>

            <!-- Průběh vlny -->
            <div class="fg-section">
                <label class="fg-label">📊 Průběh vlny</label>
                <div class="fg-waveforms">
                    <button data-wave="sine" class="fg-wave-btn active">🔊 Sinus</button>
                    <button data-wave="square" class="fg-wave-btn">⬛ Čtvercový</button>
                    <button data-wave="sawtooth" class="fg-wave-btn">📈 Pilový</button>
                    <button data-wave="triangle" class="fg-wave-btn">📐 Trojúhelníkový</button>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="fg-buttons">
                <button id="fg-play" class="fg-btn fg-btn-primary">▶ Přehrát</button>
                <button id="fg-stop" class="fg-btn fg-btn-secondary" disabled>⏹ Zastavit</button>
            </div>

            <!-- Vizualizace -->
            <div class="fg-visualization">
                <canvas id="fg-wave-canvas" class="fg-wave-canvas" width="600" height="120"></canvas>
            </div>

            <!-- Informace o tónu -->
            <div class="fg-info">
                <div class="fg-info-item">
                    <span>🎵 Tón:</span>
                    <strong id="fg-note">A4</strong>
                </div>
                <div class="fg-info-item">
                    <span>📊 Frekvence:</span>
                    <strong id="fg-freq-display">440 Hz</strong>
                </div>
            </div>

            <!-- Tip -->
            <div class="fg-tip">
                💡 <strong>Tip:</strong> Lidské ucho slyší přibližně 20 Hz až 20 000 Hz. Vyšší frekvence mohou být nepříjemné. Používej sluchátka opatrně.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const freqInput = document.getElementById('fg-frequency');
    const freqMinus = document.getElementById('fg-freq-minus');
    const freqPlus = document.getElementById('fg-freq-plus');
    const freqSlider = document.getElementById('fg-frequency-slider');
    const presetBtns = document.querySelectorAll('.fg-preset');
    const volumeSlider = document.getElementById('fg-volume');
    const volumeValue = document.getElementById('fg-volume-value');
    const waveBtns = document.querySelectorAll('.fg-wave-btn');
    const playBtn = document.getElementById('fg-play');
    const stopBtn = document.getElementById('fg-stop');
    const waveCanvas = document.getElementById('fg-wave-canvas');
    const noteSpan = document.getElementById('fg-note');
    const freqDisplaySpan = document.getElementById('fg-freq-display');

    let audioContext = null;
    let oscillator = null;
    let gainNode = null;
    let isPlaying = false;
    let currentFrequency = 440;
    let currentVolume = 0.5;
    let currentWaveform = 'sine';
    let animationId = null;

    // Inicializace AudioContext
    function initAudio() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Převod frekvence na název tónu
    function frequencyToNote(freq) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const semitones = 12 * Math.log2(freq / A4);
        const rounded = Math.round(semitones);
        const noteIndex = (rounded + 9) % 12;
        const octave = 4 + Math.floor((rounded + 9) / 12);
        return `${notes[noteIndex]}${octave}`;
    }

    function updateNoteDisplay() {
        const note = frequencyToNote(currentFrequency);
        noteSpan.textContent = note;
        freqDisplaySpan.textContent = `${Math.round(currentFrequency)} Hz`;
    }

    // Aktualizace frekvence
    function setFrequency(freq) {
        currentFrequency = Math.min(20000, Math.max(20, freq));
        freqInput.value = Math.round(currentFrequency);
        freqSlider.value = currentFrequency;
        updateNoteDisplay();
        
        if (isPlaying) {
            if (oscillator) {
                oscillator.frequency.value = currentFrequency;
            }
        }
        
        drawWaveform();
        saveSettings();
    }

    // Aktualizace hlasitosti
    function setVolume(volume) {
        currentVolume = Math.min(1, Math.max(0, volume / 100));
        volumeValue.textContent = `${Math.round(volume)}%`;
        if (gainNode) {
            gainNode.gain.value = currentVolume;
        }
        saveSettings();
    }

    // Kreslení vlny na canvas
    function drawWaveform() {
        if (!waveCanvas) return;
        
        const ctx = waveCanvas.getContext('2d');
        const width = waveCanvas.width;
        const height = waveCanvas.height;
        const sampleCount = width;
        
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        
        let x = 0;
        const step = width / sampleCount;
        
        for (let i = 0; i < sampleCount; i++) {
            const t = i / sampleCount;
            let y = 0;
            
            switch (currentWaveform) {
                case 'sine':
                    y = Math.sin(t * Math.PI * 2) * (height / 2 - 10);
                    break;
                case 'square':
                    y = Math.sin(t * Math.PI * 2) > 0 ? (height / 2 - 10) : -(height / 2 - 10);
                    break;
                case 'sawtooth':
                    y = (t * 2 - 1) * (height / 2 - 10);
                    break;
                case 'triangle':
                    y = (Math.abs((t * 4) % 4 - 2) - 1) * (height / 2 - 10);
                    break;
            }
            
            const canvasY = height / 2 + y;
            
            if (i === 0) {
                ctx.moveTo(x, canvasY);
            } else {
                ctx.lineTo(x, canvasY);
            }
            
            x += step;
        }
        
        ctx.stroke();
        
        // Středová čára
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Animace vizualizace (při přehrávání)
    function animateVisualization() {
        if (!isPlaying || !audioContext) {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            return;
        }
        
        drawWaveform();
        animationId = requestAnimationFrame(animateVisualization);
    }

    // Přehrání tónu
    async function playSound() {
        if (isPlaying) {
            stopSound();
        }
        
        initAudio();
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        
        oscillator.type = currentWaveform;
        oscillator.frequency.value = currentFrequency;
        
        gainNode.gain.value = currentVolume;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        isPlaying = true;
        
        playBtn.disabled = true;
        stopBtn.disabled = false;
        
        animateVisualization();
        showNotification(`Přehrávání tónu ${currentFrequency} Hz`, 'info');
        saveSettings();
    }

    function stopSound() {
        if (oscillator) {
            try {
                oscillator.stop();
                oscillator.disconnect();
            } catch (e) {}
            oscillator = null;
        }
        
        if (gainNode) {
            try {
                gainNode.disconnect();
            } catch (e) {}
            gainNode = null;
        }
        
        isPlaying = false;
        
        playBtn.disabled = false;
        stopBtn.disabled = true;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        drawWaveform();
        showNotification('Přehrávání zastaveno', 'info');
        saveSettings();
    }

    // Eventy
    freqMinus.addEventListener('click', () => {
        let val = currentFrequency - 10;
        if (val < 20) val = 20;
        setFrequency(val);
    });
    
    freqPlus.addEventListener('click', () => {
        let val = currentFrequency + 10;
        if (val > 20000) val = 20000;
        setFrequency(val);
    });
    
    freqInput.addEventListener('change', () => {
        setFrequency(parseFloat(freqInput.value) || 440);
    });
    
    freqSlider.addEventListener('input', (e) => {
        setFrequency(parseFloat(e.target.value));
    });
    
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setFrequency(parseFloat(btn.dataset.freq));
        });
    });
    
    volumeSlider.addEventListener('input', (e) => {
        setVolume(parseFloat(e.target.value));
    });
    
    waveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            waveBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWaveform = btn.dataset.wave;
            if (isPlaying) {
                if (oscillator) {
                    oscillator.type = currentWaveform;
                }
            }
            drawWaveform();
            saveSettings();
        });
    });
    
    playBtn.addEventListener('click', playSound);
    stopBtn.addEventListener('click', stopSound);
    
    // Resize canvas
    function resizeCanvas() {
        const container = waveCanvas.parentElement;
        const width = Math.min(container.clientWidth - 32, 600);
        waveCanvas.width = width;
        waveCanvas.height = 120;
        drawWaveform();
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('frequency', currentFrequency);
        storage.set('volume', currentVolume * 100);
        storage.set('waveform', currentWaveform);
    }
    
    function loadSettings() {
        const savedFreq = storage.get('frequency', 440);
        const savedVolume = storage.get('volume', 50);
        const savedWaveform = storage.get('waveform', 'sine');
        
        currentFrequency = savedFreq;
        currentVolume = savedVolume / 100;
        currentWaveform = savedWaveform;
        
        freqInput.value = Math.round(currentFrequency);
        freqSlider.value = currentFrequency;
        volumeSlider.value = savedVolume;
        volumeValue.textContent = `${savedVolume}%`;
        
        waveBtns.forEach(btn => {
            if (btn.dataset.wave === currentWaveform) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        presetBtns.forEach(btn => {
            if (parseFloat(btn.dataset.freq) === currentFrequency) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        updateNoteDisplay();
        drawWaveform();
    }
    
    loadSettings();
    
    // Vyčištění při odchodu
    window.addEventListener('beforeunload', () => {
        if (isPlaying) {
            stopSound();
        }
        if (audioContext) {
            audioContext.close();
        }
    });
}

export function cleanup() {
    if (isPlaying) {
        if (oscillator) {
            try { oscillator.stop(); } catch(e) {}
        }
    }
    if (audioContext) {
        try { audioContext.close(); } catch(e) {}
    }
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    console.log('Frequency Generator se zavírá');
}