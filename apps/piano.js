import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('piano');

export default function render(container) {
    container.innerHTML = `
        <div class="piano">
            <div class="piano-header">
                <span class="piano-icon">🎹</span>
                <div>
                    <h3>Piano</h3>
                    <p>Hraj na klávesách myší nebo klávesnicí</p>
                </div>
            </div>

            <!-- Ovládání -->
            <div class="piano-controls">
                <div class="piano-octave">
                    <button id="piano-octave-down" class="piano-octave-btn">−</button>
                    <span id="piano-octave-display" class="piano-octave-display">4</span>
                    <button id="piano-octave-up" class="piano-octave-btn">+</button>
                </div>
                <div class="piano-volume">
                    <span>🔊</span>
                    <input type="range" id="piano-volume" class="piano-volume-slider" min="0" max="100" value="70">
                    <span>🔈</span>
                </div>
                <div class="piano-waveform">
                    <select id="piano-waveform" class="piano-waveform-select">
                        <option value="sine">🎵 Sinus</option>
                        <option value="square">⬛ Čtvercový</option>
                        <option value="sawtooth">📈 Pilový</option>
                        <option value="triangle">📐 Trojúhelníkový</option>
                    </select>
                </div>
            </div>

            <!-- Klávesy -->
            <div class="piano-keys" id="piano-keys">
                <div class="piano-white-keys" id="piano-white-keys"></div>
                <div class="piano-black-keys" id="piano-black-keys"></div>
            </div>

            <!-- Nápověda -->
            <details class="piano-details">
                <summary>⌨️ Klávesové zkratky</summary>
                <div class="piano-shortcuts">
                    <div class="piano-shortcut-row">
                        <span><strong>C</strong> = C</span>
                        <span><strong>D</strong> = D</span>
                        <span><strong>E</strong> = E</span>
                        <span><strong>F</strong> = F</span>
                        <span><strong>G</strong> = G</span>
                        <span><strong>A</strong> = A</span>
                        <span><strong>B</strong> = B</span>
                    </div>
                    <div class="piano-shortcut-row">
                        <span><strong>W</strong> = C#</span>
                        <span><strong>R</strong> = D#</span>
                        <span><strong>Y</strong> = F#</span>
                        <span><strong>U</strong> = G#</span>
                        <span><strong>I</strong> = A#</span>
                    </div>
                    <div class="piano-shortcut-row">
                        <span>⬅️ / ➡️ = oktáva dolů / nahoru</span>
                    </div>
                </div>
            </details>

            <!-- Tip -->
            <div class="piano-tip">
                💡 <strong>Tip:</strong> Klikni na klávesy myší nebo použij klávesnici (C, D, E, F, G, A, B pro bílé, W, R, Y, U, I pro černé). Šipky mění oktávu.
            </div>
        </div>
    `;

    // ========== NOTY ==========
    const whiteKeys = [
        { note: 'C', key: 'C' },
        { note: 'D', key: 'D' },
        { note: 'E', key: 'E' },
        { note: 'F', key: 'F' },
        { note: 'G', key: 'G' },
        { note: 'A', key: 'A' },
        { note: 'B', key: 'B' }
    ];

    const blackKeys = [
        { note: 'C#', key: 'W' },
        { note: 'D#', key: 'R' },
        { note: 'F#', key: 'Y' },
        { note: 'G#', key: 'U' },
        { note: 'A#', key: 'I' }
    ];

    // Frekvence pro oktávu 4
    const baseFrequencies = {
        'C': 261.63,
        'C#': 277.18,
        'D': 293.66,
        'D#': 311.13,
        'E': 329.63,
        'F': 349.23,
        'F#': 369.99,
        'G': 392.00,
        'G#': 415.30,
        'A': 440.00,
        'A#': 466.16,
        'B': 493.88
    };

    // ========== DOM elementy ==========
    const whiteKeysDiv = document.getElementById('piano-white-keys');
    const blackKeysDiv = document.getElementById('piano-black-keys');
    const octaveDownBtn = document.getElementById('piano-octave-down');
    const octaveUpBtn = document.getElementById('piano-octave-up');
    const octaveDisplay = document.getElementById('piano-octave-display');
    const volumeSlider = document.getElementById('piano-volume');
    const waveformSelect = document.getElementById('piano-waveform');

    let currentOctave = 4;
    let currentVolume = 0.7;
    let currentWaveform = 'sine';
    let audioContext = null;
    let activeOscillators = new Map();

    function initAudio() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    function getFrequency(note) {
        const baseFreq = baseFrequencies[note];
        if (!baseFreq) return 440;
        return baseFreq * Math.pow(2, currentOctave - 4);
    }

    function playNote(note, keyElement) {
        initAudio();
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const freq = getFrequency(note);
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = currentWaveform;
        oscillator.frequency.value = freq;
        
        gainNode.gain.value = currentVolume;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        
        // Vizuální efekt
        if (keyElement) {
            keyElement.classList.add('piano-key-active');
        }
        
        // Uložení pro pozdější zastavení
        activeOscillators.set(note, { oscillator, gainNode, keyElement });
        
        // Automatické zastavení po 1 sekundě (pro delší tón)
        setTimeout(() => {
            stopNote(note);
        }, 1000);
    }

    function stopNote(note) {
        const active = activeOscillators.get(note);
        if (active) {
            try {
                active.oscillator.stop();
                active.oscillator.disconnect();
                active.gainNode.disconnect();
            } catch (e) {}
            if (active.keyElement) {
                active.keyElement.classList.remove('piano-key-active');
            }
            activeOscillators.delete(note);
        }
    }

    function stopAllNotes() {
        for (const [note, active] of activeOscillators) {
            try {
                active.oscillator.stop();
                active.oscillator.disconnect();
                active.gainNode.disconnect();
            } catch (e) {}
            if (active.keyElement) {
                active.keyElement.classList.remove('piano-key-active');
            }
        }
        activeOscillators.clear();
    }

    // Vytvoření kláves
    function createPiano() {
        // Bílé klávesy
        whiteKeysDiv.innerHTML = '';
        whiteKeys.forEach((key, index) => {
            const keyDiv = document.createElement('div');
            keyDiv.className = 'piano-white-key';
            keyDiv.dataset.note = key.note;
            keyDiv.dataset.key = key.key;
            keyDiv.innerHTML = `<span class="piano-key-label">${key.note}</span><span class="piano-key-shortcut">${key.key}</span>`;
            
            keyDiv.addEventListener('mousedown', (e) => {
                e.preventDefault();
                playNote(key.note, keyDiv);
            });
            
            keyDiv.addEventListener('mouseup', () => {
                stopNote(key.note);
            });
            
            keyDiv.addEventListener('mouseleave', () => {
                stopNote(key.note);
            });
            
            whiteKeysDiv.appendChild(keyDiv);
        });
        
        // Černé klávesy (pozicování mezi bílými)
        blackKeysDiv.innerHTML = '';
        const blackPositions = [1, 2, 4, 5, 6]; // pozice mezi bílými (0-index)
        
        blackKeys.forEach((key, index) => {
            const keyDiv = document.createElement('div');
            keyDiv.className = 'piano-black-key';
            keyDiv.dataset.note = key.note;
            keyDiv.dataset.key = key.key;
            keyDiv.style.left = `${blackPositions[index] * 48 + 36}px`;
            keyDiv.innerHTML = `<span class="piano-key-shortcut">${key.key}</span>`;
            
            keyDiv.addEventListener('mousedown', (e) => {
                e.preventDefault();
                playNote(key.note, keyDiv);
            });
            
            keyDiv.addEventListener('mouseup', () => {
                stopNote(key.note);
            });
            
            keyDiv.addEventListener('mouseleave', () => {
                stopNote(key.note);
            });
            
            blackKeysDiv.appendChild(keyDiv);
        });
    }

    // Klávesnice
    function handleKeyDown(e) {
        const key = e.key.toUpperCase();
        
        // Šipky pro oktávu
        if (key === 'ARROWLEFT') {
            e.preventDefault();
            changeOctave(-1);
            return;
        }
        if (key === 'ARROWRIGHT') {
            e.preventDefault();
            changeOctave(1);
            return;
        }
        
        // Najít notu podle klávesy
        const whiteKey = whiteKeys.find(k => k.key === key);
        if (whiteKey) {
            e.preventDefault();
            const keyElement = document.querySelector(`.piano-white-key[data-note="${whiteKey.note}"]`);
            playNote(whiteKey.note, keyElement);
            return;
        }
        
        const blackKey = blackKeys.find(k => k.key === key);
        if (blackKey) {
            e.preventDefault();
            const keyElement = document.querySelector(`.piano-black-key[data-note="${blackKey.note}"]`);
            playNote(blackKey.note, keyElement);
            return;
        }
    }
    
    function handleKeyUp(e) {
        const key = e.key.toUpperCase();
        
        const whiteKey = whiteKeys.find(k => k.key === key);
        if (whiteKey) {
            stopNote(whiteKey.note);
            return;
        }
        
        const blackKey = blackKeys.find(k => k.key === key);
        if (blackKey) {
            stopNote(blackKey.note);
            return;
        }
    }

    function changeOctave(delta) {
        const newOctave = currentOctave + delta;
        if (newOctave >= 1 && newOctave <= 7) {
            currentOctave = newOctave;
            octaveDisplay.textContent = currentOctave;
            showNotification(`Oktáva ${currentOctave}`, 'info');
            saveSettings();
        }
    }

    function setVolume(value) {
        currentVolume = value / 100;
        saveSettings();
    }

    function setWaveform(waveform) {
        currentWaveform = waveform;
        saveSettings();
    }

    // Eventy
    octaveDownBtn.addEventListener('click', () => changeOctave(-1));
    octaveUpBtn.addEventListener('click', () => changeOctave(1));
    volumeSlider.addEventListener('input', (e) => setVolume(parseInt(e.target.value)));
    waveformSelect.addEventListener('change', (e) => setWaveform(e.target.value));
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('octave', currentOctave);
        storage.set('volume', currentVolume * 100);
        storage.set('waveform', currentWaveform);
    }
    
    function loadSettings() {
        currentOctave = storage.get('octave', 4);
        currentVolume = storage.get('volume', 70) / 100;
        currentWaveform = storage.get('waveform', 'sine');
        
        octaveDisplay.textContent = currentOctave;
        volumeSlider.value = currentVolume * 100;
        waveformSelect.value = currentWaveform;
    }
    
    createPiano();
    loadSettings();
    
    // Vyčištění při odchodu
    window.addEventListener('beforeunload', () => {
        stopAllNotes();
        if (audioContext) {
            audioContext.close();
        }
    });
}

export function cleanup() {
    stopAllNotes();
    if (audioContext) {
        audioContext.close();
    }
    console.log('Piano se zavírá');
}