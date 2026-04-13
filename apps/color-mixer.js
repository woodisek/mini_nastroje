import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('color-mixer');

export default function render(container) {
    container.innerHTML = `
        <div class="color-mixer">
            <div class="cm-header">
                <span class="cm-icon">🎨</span>
                <div>
                    <h3>Míchadlo barev</h3>
                    <p>Míchej barvy a sleduj výsledek</p>
                </div>
            </div>

            <!-- Barva 1 -->
            <div class="cm-section">
                <label class="cm-label">🎨 Barva 1</label>
                <div class="cm-color-row">
                    <input type="color" id="cm-color1" class="cm-color-input" value="#ff0000">
                    <div class="cm-rgb-controls">
                        <label>R: <input type="range" id="cm-r1" class="cm-rgb-slider" min="0" max="255" value="255" data-color="1" data-channel="r"></label>
                        <label>G: <input type="range" id="cm-g1" class="cm-rgb-slider" min="0" max="255" value="0" data-color="1" data-channel="g"></label>
                        <label>B: <input type="range" id="cm-b1" class="cm-rgb-slider" min="0" max="255" value="0" data-color="1" data-channel="b"></label>
                    </div>
                    <input type="text" id="cm-hex1" class="cm-hex-input" value="#ff0000" maxlength="7">
                </div>
            </div>

            <!-- Barva 2 -->
            <div class="cm-section">
                <label class="cm-label">🎨 Barva 2</label>
                <div class="cm-color-row">
                    <input type="color" id="cm-color2" class="cm-color-input" value="#0000ff">
                    <div class="cm-rgb-controls">
                        <label>R: <input type="range" id="cm-r2" class="cm-rgb-slider" min="0" max="255" value="0" data-color="2" data-channel="r"></label>
                        <label>G: <input type="range" id="cm-g2" class="cm-rgb-slider" min="0" max="255" value="0" data-color="2" data-channel="g"></label>
                        <label>B: <input type="range" id="cm-b2" class="cm-rgb-slider" min="0" max="255" value="255" data-color="2" data-channel="b"></label>
                    </div>
                    <input type="text" id="cm-hex2" class="cm-hex-input" value="#0000ff" maxlength="7">
                </div>
            </div>

            <!-- Poměr míchání -->
            <div class="cm-section">
                <label class="cm-label">⚖️ Poměr míchání</label>
                <div class="cm-ratio-control">
                    <span>Barva 1</span>
                    <input type="range" id="cm-ratio" class="cm-ratio-slider" min="0" max="100" value="50">
                    <span>Barva 2</span>
                </div>
                <div class="cm-ratio-values">
                    <span id="cm-ratio1">50%</span>
                    <span id="cm-ratio2">50%</span>
                </div>
            </div>

            <!-- Výsledná barva -->
            <div class="cm-result-section">
                <div class="cm-result-header">
                    <span>🎨 Výsledná barva</span>
                    <button id="cm-copy" class="cm-small-btn">📋 Kopírovat HEX</button>
                </div>
                <div id="cm-result-color" class="cm-result-color" style="background-color: #800080"></div>
                <div class="cm-result-info">
                    <span id="cm-result-hex">#800080</span>
                    <span id="cm-result-rgb">rgb(128, 0, 128)</span>
                </div>
            </div>

            <!-- Náhledy -->
            <div class="cm-previews">
                <div class="cm-preview">
                    <div class="cm-preview-color" id="cm-preview1" style="background-color: #ff0000"></div>
                    <span>Barva 1</span>
                </div>
                <div class="cm-preview-plus">+</div>
                <div class="cm-preview">
                    <div class="cm-preview-color" id="cm-preview2" style="background-color: #0000ff"></div>
                    <span>Barva 2</span>
                </div>
                <div class="cm-preview-equals">=</div>
                <div class="cm-preview">
                    <div class="cm-preview-color" id="cm-preview-result" style="background-color: #800080"></div>
                    <span>Výsledek</span>
                </div>
            </div>

            <!-- Tip -->
            <div class="cm-tip">
                💡 <strong>Tip:</strong> Můžeš vybrat barvu pomocí color pickeru, RGB sliderů nebo zadat HEX kód. Výsledná barva se aktualizuje automaticky.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const color1Input = document.getElementById('cm-color1');
    const color2Input = document.getElementById('cm-color2');
    const hex1Input = document.getElementById('cm-hex1');
    const hex2Input = document.getElementById('cm-hex2');
    const r1Slider = document.getElementById('cm-r1');
    const g1Slider = document.getElementById('cm-g1');
    const b1Slider = document.getElementById('cm-b1');
    const r2Slider = document.getElementById('cm-r2');
    const g2Slider = document.getElementById('cm-g2');
    const b2Slider = document.getElementById('cm-b2');
    const ratioSlider = document.getElementById('cm-ratio');
    const ratio1Span = document.getElementById('cm-ratio1');
    const ratio2Span = document.getElementById('cm-ratio2');
    const resultColorDiv = document.getElementById('cm-result-color');
    const resultHexSpan = document.getElementById('cm-result-hex');
    const resultRgbSpan = document.getElementById('cm-result-rgb');
    const preview1Div = document.getElementById('cm-preview1');
    const preview2Div = document.getElementById('cm-preview2');
    const previewResultDiv = document.getElementById('cm-preview-result');
    const copyBtn = document.getElementById('cm-copy');

    let color1 = { r: 255, g: 0, b: 0 };
    let color2 = { r: 0, g: 0, b: 255 };
    let ratio = 50;

    // Převod RGB na HEX
    function rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Převod HEX na RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Aktualizace UI pro barvu 1
    function updateColor1UI() {
        color1Input.value = rgbToHex(color1.r, color1.g, color1.b);
        hex1Input.value = rgbToHex(color1.r, color1.g, color1.b);
        r1Slider.value = color1.r;
        g1Slider.value = color1.g;
        b1Slider.value = color1.b;
        preview1Div.style.backgroundColor = rgbToHex(color1.r, color1.g, color1.b);
    }

    // Aktualizace UI pro barvu 2
    function updateColor2UI() {
        color2Input.value = rgbToHex(color2.r, color2.g, color2.b);
        hex2Input.value = rgbToHex(color2.r, color2.g, color2.b);
        r2Slider.value = color2.r;
        g2Slider.value = color2.g;
        b2Slider.value = color2.b;
        preview2Div.style.backgroundColor = rgbToHex(color2.r, color2.g, color2.b);
    }

    // Výpočet výsledné barvy
    function calculateMixedColor() {
        const ratio1 = ratio / 100;
        const ratio2 = 1 - ratio1;
        
        const r = Math.round(color1.r * ratio2 + color2.r * ratio1);
        const g = Math.round(color1.g * ratio2 + color2.g * ratio1);
        const b = Math.round(color1.b * ratio2 + color2.b * ratio1);
        
        return { r, g, b };
    }

    // Aktualizace výsledku
    function updateResult() {
        const mixed = calculateMixedColor();
        const hex = rgbToHex(mixed.r, mixed.g, mixed.b);
        
        resultColorDiv.style.backgroundColor = hex;
        resultHexSpan.textContent = hex.toUpperCase();
        resultRgbSpan.textContent = `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`;
        previewResultDiv.style.backgroundColor = hex;
        
        saveSettings();
    }

    // Aktualizace poměru
    function updateRatio() {
        const val = ratioSlider.value;
        ratio = val;
        ratio1Span.textContent = `${100 - val}%`;
        ratio2Span.textContent = `${val}%`;
        updateResult();
    }

    // Nastavení barvy 1 z RGB
    function setColor1(r, g, b) {
        color1 = { r, g, b };
        updateColor1UI();
        updateResult();
    }

    // Nastavení barvy 2 z RGB
    function setColor2(r, g, b) {
        color2 = { r, g, b };
        updateColor2UI();
        updateResult();
    }

    // Eventy pro barvu 1
    color1Input.addEventListener('input', (e) => {
        const rgb = hexToRgb(e.target.value);
        if (rgb) setColor1(rgb.r, rgb.g, rgb.b);
    });
    
    hex1Input.addEventListener('input', (e) => {
        let val = e.target.value;
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            const rgb = hexToRgb(val);
            if (rgb) setColor1(rgb.r, rgb.g, rgb.b);
        }
    });
    
    r1Slider.addEventListener('input', (e) => setColor1(parseInt(e.target.value), color1.g, color1.b));
    g1Slider.addEventListener('input', (e) => setColor1(color1.r, parseInt(e.target.value), color1.b));
    b1Slider.addEventListener('input', (e) => setColor1(color1.r, color1.g, parseInt(e.target.value)));
    
    // Eventy pro barvu 2
    color2Input.addEventListener('input', (e) => {
        const rgb = hexToRgb(e.target.value);
        if (rgb) setColor2(rgb.r, rgb.g, rgb.b);
    });
    
    hex2Input.addEventListener('input', (e) => {
        let val = e.target.value;
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            const rgb = hexToRgb(val);
            if (rgb) setColor2(rgb.r, rgb.g, rgb.b);
        }
    });
    
    r2Slider.addEventListener('input', (e) => setColor2(parseInt(e.target.value), color2.g, color2.b));
    g2Slider.addEventListener('input', (e) => setColor2(color2.r, parseInt(e.target.value), color2.b));
    b2Slider.addEventListener('input', (e) => setColor2(color2.r, color2.g, parseInt(e.target.value)));
    
    // Poměr míchání
    ratioSlider.addEventListener('input', updateRatio);
    
    // Kopírování
    copyBtn.addEventListener('click', async () => {
        const hex = resultHexSpan.textContent;
        await copyToClipboard(hex);
        showNotification(`Zkopírováno: ${hex}`);
    });
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('color1', rgbToHex(color1.r, color1.g, color1.b));
        storage.set('color2', rgbToHex(color2.r, color2.g, color2.b));
        storage.set('ratio', ratio);
    }
    
    function loadSettings() {
        const savedColor1 = storage.get('color1', '#ff0000');
        const savedColor2 = storage.get('color2', '#0000ff');
        const savedRatio = storage.get('ratio', 50);
        
        const rgb1 = hexToRgb(savedColor1);
        const rgb2 = hexToRgb(savedColor2);
        
        if (rgb1) setColor1(rgb1.r, rgb1.g, rgb1.b);
        if (rgb2) setColor2(rgb2.r, rgb2.g, rgb2.b);
        
        ratioSlider.value = savedRatio;
        updateRatio();
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Color Mixer se zavírá');
}