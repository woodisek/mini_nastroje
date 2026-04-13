import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('noise-meter');

export default function render(container) {
    container.innerHTML = `
        <div class="noise-meter">
            <div class="nm-header">
                <span class="nm-icon">🎤</span>
                <div>
                    <h3>Měřič hluku</h3>
                    <p>Měří okolní hluk pomocí mikrofonu</p>
                </div>
            </div>

            <!-- Hladina hluku -->
            <div class="nm-level-display">
                <div class="nm-level-value" id="nm-level-value">0</div>
                <div class="nm-level-unit">dB</div>
            </div>

            <!-- Vizuální ukazatel -->
            <div class="nm-meter">
                <div class="nm-meter-bar" id="nm-meter-bar"></div>
                <div class="nm-meter-markers">
                    <span>0</span>
                    <span>30</span>
                    <span>60</span>
                    <span>90</span>
                    <span>120</span>
                </div>
            </div>

            <!-- Popis úrovně -->
            <div class="nm-description" id="nm-description">
                🎤 Klikni na "Spustit měření"
            </div>

            <!-- Kalibrace -->
            <div class="nm-section">
                <label class="nm-label">🔧 Citlivost (pro lepší měření)</label>
                <div class="nm-sensitivity">
                    <button id="nm-sens-low" class="nm-sens-btn">Nízká</button>
                    <button id="nm-sens-medium" class="nm-sens-btn active">Střední</button>
                    <button id="nm-sens-high" class="nm-sens-btn">Vysoká</button>
                </div>
                <div class="nm-hint">Pokud je hodnota příliš nízká, zvyš citlivost</div>
            </div>

            <!-- Ovládání -->
            <div class="nm-controls">
                <button id="nm-start" class="nm-btn nm-btn-primary">🎤 Spustit měření</button>
                <button id="nm-stop" class="nm-btn nm-btn-secondary" disabled>⏹ Zastavit</button>
            </div>

            <!-- Statistiky -->
            <div class="nm-stats">
                <div class="nm-stat-card">
                    <div class="nm-stat-value" id="nm-min">0</div>
                    <div class="nm-stat-label">minimum</div>
                </div>
                <div class="nm-stat-card">
                    <div class="nm-stat-value" id="nm-max">0</div>
                    <div class="nm-stat-label">maximum</div>
                </div>
                <div class="nm-stat-card">
                    <div class="nm-stat-value" id="nm-avg">0</div>
                    <div class="nm-stat-label">průměr</div>
                </div>
            </div>

            <!-- Reference hladin -->
            <details class="nm-details">
                <summary>📊 Referenční hladiny hluku</summary>
                <div class="nm-table">
                    <div class="nm-table-row"><span>30 dB</span><span>Ticho / šepot</span></div>
                    <div class="nm-table-row"><span>50 dB</span><span>Klidná kancelář</span></div>
                    <div class="nm-table-row"><span>70 dB</span><span>Hlasitá konverzace</span></div>
                    <div class="nm-table-row"><span>85 dB</span><span>Hlučná ulice</span></div>
                    <div class="nm-table-row"><span>100 dB</span><span>Motorka / sekačka</span></div>
                    <div class="nm-table-row"><span>120 dB</span><span>Koncert / siréna</span></div>
                </div>
            </details>

            <!-- Tip -->
            <div class="nm-tip">
                💡 <strong>Tip:</strong> Pokud měření ukazuje stále stejnou hodnotu, zkus zvýšit citlivost nebo mluv do mikrofonu.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const levelValueSpan = document.getElementById('nm-level-value');
    const meterBar = document.getElementById('nm-meter-bar');
    const descriptionDiv = document.getElementById('nm-description');
    const startBtn = document.getElementById('nm-start');
    const stopBtn = document.getElementById('nm-stop');
    const minSpan = document.getElementById('nm-min');
    const maxSpan = document.getElementById('nm-max');
    const avgSpan = document.getElementById('nm-avg');
    const sensLowBtn = document.getElementById('nm-sens-low');
    const sensMediumBtn = document.getElementById('nm-sens-medium');
    const sensHighBtn = document.getElementById('nm-sens-high');

    let mediaStream = null;
    let audioContext = null;
    let sourceNode = null;
    let analyserNode = null;
    let animationId = null;
    let isMeasuring = false;
    
    let measurements = [];
    let currentLevel = 0;
    let minLevel = 0;
    let maxLevel = 0;
    let avgLevel = 0;
    let sensitivity = 'medium'; // low, medium, high

    // Kalibrační faktory
    const sensitivityFactors = {
        low: { offset: 40, scale: 1.2 },
        medium: { offset: 50, scale: 1.5 },
        high: { offset: 60, scale: 2.0 }
    };

    function updateSensitivityButtons() {
        sensLowBtn.classList.remove('active');
        sensMediumBtn.classList.remove('active');
        sensHighBtn.classList.remove('active');
        
        if (sensitivity === 'low') sensLowBtn.classList.add('active');
        else if (sensitivity === 'medium') sensMediumBtn.classList.add('active');
        else sensHighBtn.classList.add('active');
    }

    // Převod dBFS na přibližné dB SPL s kalibrací
    function dbFSToDbSPL(dbFS) {
        const factor = sensitivityFactors[sensitivity];
        // dBFS je obvykle v rozsahu -100 až 0
        // Čím vyšší dBFS (blíže 0), tím hlasitější zvuk
        let spl = factor.offset + (dbFS + 50) * factor.scale;
        return Math.max(20, Math.min(120, spl));
    }

    function updateLevel() {
        if (!analyserNode || !isMeasuring) return;
        
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteTimeDomainData(dataArray);
        
        // Výpočet RMS (root mean square) pro přesnější měření
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
        }
        let rms = Math.sqrt(sum / dataArray.length);
        
        // Převod na dBFS
        let dbFS = -Infinity;
        if (rms > 0.0001) {
            dbFS = 20 * Math.log10(rms);
        }
        dbFS = Math.max(-100, Math.min(0, dbFS));
        
        // Převod na dB SPL
        currentLevel = Math.round(dbFSToDbSPL(dbFS));
        
        // Vyhlazení pro plynulejší zobrazení
        if (measurements.length > 0) {
            const lastLevel = measurements[measurements.length - 1];
            currentLevel = Math.round(lastLevel * 0.7 + currentLevel * 0.3);
        }
        
        // Aktualizace UI
        levelValueSpan.textContent = currentLevel;
        
        // Aktualizace vizuálního metru (0-120 dB)
        const percent = Math.min(100, (currentLevel / 120) * 100);
        meterBar.style.width = `${percent}%`;
        
        // Barva podle úrovně
        if (currentLevel < 40) {
            meterBar.style.background = '#4caf50';
            descriptionDiv.innerHTML = '🔇 Ticho / šepot';
            descriptionDiv.style.color = '#4caf50';
        } else if (currentLevel < 60) {
            meterBar.style.background = '#8bc34a';
            descriptionDiv.innerHTML = '💬 Klidný hovor';
            descriptionDiv.style.color = '#8bc34a';
        } else if (currentLevel < 80) {
            meterBar.style.background = '#ffc107';
            descriptionDiv.innerHTML = '🗣️ Hlasitý hovor';
            descriptionDiv.style.color = '#ffc107';
        } else if (currentLevel < 100) {
            meterBar.style.background = '#ff9800';
            descriptionDiv.innerHTML = '📢 Hlučná ulice';
            descriptionDiv.style.color = '#ff9800';
        } else {
            meterBar.style.background = '#f44336';
            descriptionDiv.innerHTML = '🔊 Velmi hlučné!';
            descriptionDiv.style.color = '#f44336';
        }
        
        // Uložení měření pro statistiku
        measurements.push(currentLevel);
        if (measurements.length > 100) measurements.shift();
        
        // Výpočet statistik
        minLevel = Math.min(...measurements);
        maxLevel = Math.max(...measurements);
        avgLevel = Math.round(measurements.reduce((a, b) => a + b, 0) / measurements.length);
        
        minSpan.textContent = minLevel;
        maxSpan.textContent = maxLevel;
        avgSpan.textContent = avgLevel;
        
        // Pokračování animace
        animationId = requestAnimationFrame(updateLevel);
    }

    async function startMeasurement() {
        if (isMeasuring) return;
        
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 512; // Větší pro přesnější měření
            
            sourceNode = audioContext.createMediaStreamSource(mediaStream);
            sourceNode.connect(analyserNode);
            
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            isMeasuring = true;
            measurements = [];
            minLevel = 0;
            maxLevel = 0;
            avgLevel = 0;
            minSpan.textContent = '0';
            maxSpan.textContent = '0';
            avgSpan.textContent = '0';
            
            startBtn.disabled = true;
            stopBtn.disabled = false;
            
            updateLevel();
            showNotification('Měření spuštěno', 'success');
            storage.set('sensitivity', sensitivity);
            
        } catch (err) {
            console.error('Chyba při přístupu k mikrofonu:', err);
            showNotification('Nelze získat přístup k mikrofonu. Povol přístup v prohlížeči.', 'error');
        }
    }

    function stopMeasurement() {
        if (!isMeasuring) return;
        
        isMeasuring = false;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        if (sourceNode) {
            sourceNode.disconnect();
            sourceNode = null;
        }
        
        if (analyserNode) {
            analyserNode.disconnect();
            analyserNode = null;
        }
        
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        
        levelValueSpan.textContent = '0';
        meterBar.style.width = '0%';
        descriptionDiv.innerHTML = '🎤 Měření zastaveno';
        descriptionDiv.style.color = '#888';
        
        showNotification('Měření zastaveno');
    }

    function setSensitivity(level) {
        sensitivity = level;
        updateSensitivityButtons();
        storage.set('sensitivity', sensitivity);
        
        if (isMeasuring) {
            // Restart měření pro novou kalibraci
            stopMeasurement();
            setTimeout(() => startMeasurement(), 100);
        }
    }

    // Eventy
    startBtn.addEventListener('click', startMeasurement);
    stopBtn.addEventListener('click', stopMeasurement);
    sensLowBtn.addEventListener('click', () => setSensitivity('low'));
    sensMediumBtn.addEventListener('click', () => setSensitivity('medium'));
    sensHighBtn.addEventListener('click', () => setSensitivity('high'));
    
    // Načtení nastavení
    function loadSettings() {
        const savedSensitivity = storage.get('sensitivity', 'medium');
        sensitivity = savedSensitivity;
        updateSensitivityButtons();
    }
    
    // Vyčištění při odchodu
    window.addEventListener('beforeunload', () => {
        if (isMeasuring) stopMeasurement();
    });
    
    loadSettings();
}

export function cleanup() {
    if (isMeasuring) {
        if (animationId) cancelAnimationFrame(animationId);
        if (sourceNode) sourceNode.disconnect();
        if (analyserNode) analyserNode.disconnect();
        if (audioContext) audioContext.close();
        if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
    }
    console.log('Noise Meter se zavírá');
}