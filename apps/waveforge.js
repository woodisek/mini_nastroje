import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('waveforge');

export default function render(container) {
    container.innerHTML = `
        <div class="waveforge">
            <div class="wf-header">
                <span class="wf-icon">🎵</span>
                <div>
                    <h3>WaveForge Visualizer</h3>
                    <p>Vizualizace zvuku v reálném čase</p>
                </div>
            </div>

            <div class="wf-canvas-container">
                <canvas id="wf-canvas" class="wf-canvas" width="800" height="300"></canvas>
            </div>

            <div class="wf-controls">
                <button id="wf-start" class="wf-btn wf-btn-primary">🎤 Spustit mikrofon</button>
                <button id="wf-stop" class="wf-btn wf-btn-secondary" disabled>⏹ Zastavit</button>
            </div>

            <div class="wf-section">
                <label class="wf-label">🎨 Typ vizualizace</label>
                <div class="wf-types">
                    <button data-type="bars" class="wf-type-btn active">📊 Sloupce</button>
                    <button data-type="wave" class="wf-type-btn">🌊 Křivka</button>
                    <button data-type="circle" class="wf-type-btn">⚪ Kruh</button>
                    <button data-type="frequency" class="wf-type-btn">📈 Frekvence</button>
                </div>
            </div>

            <div class="wf-section">
                <label class="wf-label">🎨 Barva</label>
                <div class="wf-colors">
                    <button data-color="gradient" class="wf-color-btn active" style="background: linear-gradient(135deg, #667eea, #764ba2)"></button>
                    <button data-color="cyan" class="wf-color-btn" style="background: #00bcd4"></button>
                    <button data-color="green" class="wf-color-btn" style="background: #4caf50"></button>
                    <button data-color="red" class="wf-color-btn" style="background: #f44336"></button>
                    <button data-color="orange" class="wf-color-btn" style="background: #ff9800"></button>
                    <button data-color="purple" class="wf-color-btn" style="background: #9c27b0"></button>
                    <button data-color="rainbow" class="wf-color-btn" style="background: linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet)"></button>
                </div>
            </div>

            <div class="wf-section">
                <label class="wf-label">🔊 Citlivost</label>
                <div class="wf-sensitivity">
                    <input type="range" id="wf-sensitivity" class="wf-slider" min="0.5" max="3" step="0.1" value="1.5">
                    <span id="wf-sensitivity-value">1.5</span>
                </div>
            </div>

            <div class="wf-section">
                <label class="wf-label">🔊 Hlasitost (dB)</label>
                <div class="wf-volume-meter">
                    <div class="wf-volume-bar" id="wf-volume-bar"></div>
                </div>
                <div class="wf-volume-value" id="wf-volume-value">0 dB</div>
            </div>

            <div class="wf-tip">
                💡 <strong>Tip:</strong> Povol přístup k mikrofonu pro vizualizaci zvuku. Funguje s hudbou, hlasem nebo jakýmkoliv zvukem.
            </div>
        </div>
    `;

    const canvas = document.getElementById('wf-canvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('wf-start');
    const stopBtn = document.getElementById('wf-stop');
    const typeBtns = document.querySelectorAll('.wf-type-btn');
    const colorBtns = document.querySelectorAll('.wf-color-btn');
    const sensitivitySlider = document.getElementById('wf-sensitivity');
    const sensitivityValue = document.getElementById('wf-sensitivity-value');
    const volumeBar = document.getElementById('wf-volume-bar');
    const volumeValueSpan = document.getElementById('wf-volume-value');

    let mediaStream = null;
    let audioContext = null;
    let sourceNode = null;
    let analyserNode = null;
    let animationId = null;
    let isActive = false;
    let currentType = 'bars';
    let currentColor = 'gradient';
    let sensitivity = 1.5;
    let dataArray = null;

    function resizeCanvas() {
        const container = canvas.parentElement;
        if (container) {
            const width = Math.min(container.clientWidth - 32, 800);
            canvas.width = width;
            canvas.height = 300;
        } else {
            canvas.width = 800;
            canvas.height = 300;
        }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const colors = {
        gradient: '#667eea',
        cyan: '#00bcd4',
        green: '#4caf50',
        red: '#f44336',
        orange: '#ff9800',
        purple: '#9c27b0',
        rainbow: (percent, index, total) => {
            const hue = (index / total) * 360;
            return `hsl(${hue}, 70%, 60%)`;
        }
    };

    function getColor(percent, index, total) {
        if (currentColor === 'rainbow') {
            return colors.rainbow(percent, index, total);
        }
        if (currentColor === 'gradient') {
            const hue = 240 + percent * 60;
            return `hsl(${hue}, 70%, 60%)`;
        }
        return colors[currentColor] || '#667eea';
    }

    function drawBars(data) {
        const barWidth = canvas.width / data.length;
        let x = 0;
        
        for (let i = 0; i < data.length; i++) {
            const height = (data[i] / 255) * canvas.height * sensitivity;
            const color = getColor(data[i] / 255, i, data.length);
            
            ctx.fillStyle = color;
            ctx.fillRect(x, canvas.height - height, Math.max(1, barWidth - 1), height);
            
            x += barWidth;
        }
    }

    function drawWaveform(data) {
        const sliceWidth = canvas.width / data.length;
        let x = 0;
        
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        
        for (let i = 0; i < data.length; i++) {
            const y = canvas.height / 2 - (data[i] / 255) * canvas.height * sensitivity * 0.5;
            ctx.lineTo(x, y);
            x += sliceWidth;
        }
        
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = currentColor === 'gradient' ? '#667eea' : (currentColor === 'rainbow' ? '#667eea' : colors[currentColor]);
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawCircle(data) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 3;
        const angleStep = (Math.PI * 2) / data.length;
        
        for (let i = 0; i < data.length; i++) {
            const amplitude = (data[i] / 255) * radius * sensitivity;
            const angle = i * angleStep;
            const x1 = centerX + radius * Math.cos(angle);
            const y1 = centerY + radius * Math.sin(angle);
            const x2 = centerX + (radius + amplitude) * Math.cos(angle);
            const y2 = centerY + (radius + amplitude) * Math.sin(angle);
            
            const color = getColor(data[i] / 255, i, data.length);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    function drawFrequency(data) {
        const barWidth = canvas.width / 32;
        const step = Math.floor(data.length / 32);
        
        for (let i = 0; i < 32; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
                const idx = i * step + j;
                if (idx < data.length) {
                    sum += data[idx] || 0;
                }
            }
            const avg = sum / step;
            const height = (avg / 255) * canvas.height * sensitivity;
            const color = getColor(avg / 255, i, 32);
            
            ctx.fillStyle = color;
            ctx.fillRect(i * barWidth, canvas.height - height, Math.max(1, barWidth - 2), height);
        }
    }

    function drawVolumeMeter(volume) {
        const percent = Math.min(100, (volume / 255) * 100);
        if (volumeBar) {
            volumeBar.style.width = percent + '%';
        }
        const db = Math.round(20 * Math.log10((volume / 255) + 0.01));
        if (volumeValueSpan) {
            volumeValueSpan.textContent = db + ' dB';
        }
        
        if (percent < 30) {
            if (volumeBar) volumeBar.style.background = '#4caf50';
        } else if (percent < 70) {
            if (volumeBar) volumeBar.style.background = '#ff9800';
        } else {
            if (volumeBar) volumeBar.style.background = '#f44336';
        }
    }

    function visualize() {
        if (!isActive || !analyserNode || !dataArray) return;
        
        analyserNode.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const avgVolume = sum / dataArray.length;
        drawVolumeMeter(avgVolume);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        switch (currentType) {
            case 'bars':
                drawBars(dataArray);
                break;
            case 'wave':
                drawWaveform(dataArray);
                break;
            case 'circle':
                drawCircle(dataArray);
                break;
            case 'frequency':
                drawFrequency(dataArray);
                break;
        }
        
        animationId = requestAnimationFrame(visualize);
    }

    async function startMicrophone() {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 256;
            
            const bufferLength = analyserNode.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            sourceNode = audioContext.createMediaStreamSource(mediaStream);
            sourceNode.connect(analyserNode);
            
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            isActive = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            
            visualize();
            showNotification('Mikrofon spuštěn', 'success');
            
        } catch (err) {
            console.error('Chyba při přístupu k mikrofonu:', err);
            showNotification('Nelze získat přístup k mikrofonu', 'error');
        }
    }

    function stopMicrophone() {
        isActive = false;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        if (sourceNode) {
            try {
                sourceNode.disconnect();
            } catch (e) {}
            sourceNode = null;
        }
        
        if (analyserNode) {
            try {
                analyserNode.disconnect();
            } catch (e) {}
            analyserNode = null;
        }
        
        if (audioContext) {
            try {
                audioContext.close();
            } catch (e) {}
            audioContext = null;
        }
        
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        
        dataArray = null;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (volumeBar) volumeBar.style.width = '0%';
        if (volumeValueSpan) volumeValueSpan.textContent = '0 dB';
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        
        showNotification('Mikrofon zastaven');
    }

    startBtn.addEventListener('click', startMicrophone);
    stopBtn.addEventListener('click', stopMicrophone);
    
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.dataset.type;
            saveSettings();
        });
    });
    
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentColor = btn.dataset.color;
            saveSettings();
        });
    });
    
    if (sensitivitySlider) {
        sensitivitySlider.addEventListener('input', (e) => {
            sensitivity = parseFloat(e.target.value);
            if (sensitivityValue) sensitivityValue.textContent = sensitivity;
            saveSettings();
        });
    }
    
    function saveSettings() {
        storage.set('type', currentType);
        storage.set('color', currentColor);
        storage.set('sensitivity', sensitivity);
    }
    
    function loadSettings() {
        currentType = storage.get('type', 'bars');
        currentColor = storage.get('color', 'gradient');
        sensitivity = storage.get('sensitivity', 1.5);
        
        if (sensitivitySlider) {
            sensitivitySlider.value = sensitivity;
        }
        if (sensitivityValue) {
            sensitivityValue.textContent = sensitivity;
        }
        
        typeBtns.forEach(btn => {
            if (btn.dataset.type === currentType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        colorBtns.forEach(btn => {
            if (btn.dataset.color === currentColor) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    loadSettings();
    
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function cleanup() {
    if (animationId) cancelAnimationFrame(animationId);
    if (sourceNode) {
        try { sourceNode.disconnect(); } catch(e) {}
    }
    if (analyserNode) {
        try { analyserNode.disconnect(); } catch(e) {}
    }
    if (audioContext) {
        try { audioContext.close(); } catch(e) {}
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    console.log('WaveForge se zavírá');
}