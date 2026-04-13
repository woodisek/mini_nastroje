import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('qr-generator');

// Načtení knihovny QRCode
const loadQRCodeLib = () => {
    return new Promise((resolve, reject) => {
        if (typeof QRCode !== 'undefined') {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Nepodařilo se načíst knihovnu QR kódu'));
        document.head.appendChild(script);
    });
};

export default async function render(container) {
    // Načtení knihovny
    try {
        await loadQRCodeLib();
    } catch (error) {
        container.innerHTML = `
            <div class="qr-generator">
                <div class="qrg-header">
                    <span class="qrg-icon">📱</span>
                    <div>
                        <h3>QR kód generátor</h3>
                        <p>Vytvoř QR kód z textu nebo odkazu</p>
                    </div>
                </div>
                <div class="qrg-error">
                    ❌ Nepodařilo se načíst knihovnu QR kódu. Zkontroluj připojení k internetu.
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="qr-generator">
            <div class="qrg-header">
                <span class="qrg-icon">📱</span>
                <div>
                    <h3>QR kód generátor</h3>
                    <p>Vytvoř QR kód z textu nebo odkazu</p>
                </div>
            </div>

            <!-- Vstupní text -->
            <div class="qrg-section">
                <label class="qrg-label">📝 Text nebo URL</label>
                <textarea id="qrg-text" class="qrg-textarea" rows="4" placeholder="Sem vlož text, URL, kontakt nebo jiná data...&#10;&#10;Např.:&#10;https://www.google.com&#10;ahoj@email.cz&#10;+420 123 456 789"></textarea>
            </div>

            <!-- Velikost QR kódu -->
            <div class="qrg-section">
                <label class="qrg-label">📏 Velikost QR kódu</label>
                <div class="qrg-size-control">
                    <button id="qrg-size-minus" class="qrg-size-btn">−</button>
                    <input type="number" id="qrg-size" class="qrg-size-input" value="200" min="100" max="500" step="10">
                    <button id="qrg-size-plus" class="qrg-size-btn">+</button>
                </div>
                <div class="qrg-hint">px (100-500)</div>
            </div>

            <!-- Barvy -->
            <div class="qrg-section">
                <label class="qrg-label">🎨 Barvy QR kódu</label>
                <div class="qrg-colors">
                    <div class="qrg-color-row">
                        <span>Barva pozadí:</span>
                        <input type="color" id="qrg-bg-color" class="qrg-color-input" value="#ffffff">
                    </div>
                    <div class="qrg-color-row">
                        <span>Barva kódu:</span>
                        <input type="color" id="qrg-fg-color" class="qrg-color-input" value="#000000">
                    </div>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="qrg-buttons">
                <button id="qrg-generate" class="qrg-btn qrg-btn-primary">✨ Generovat QR kód</button>
                <button id="qrg-download" class="qrg-btn qrg-btn-secondary" disabled>💾 Stáhnout QR kód</button>
            </div>

            <!-- Náhled QR kódu -->
            <div class="qrg-preview-section">
                <div class="qrg-preview-header">
                    <span>📱 Náhled QR kódu</span>
                    <button id="qrg-copy" class="qrg-small-btn" disabled>📋 Kopírovat text</button>
                </div>
                <div id="qrg-qrcode" class="qrg-qrcode">
                    <div class="qrg-empty">Zadej text a klikni na "Generovat"</div>
                </div>
            </div>

            <!-- Tipy -->
            <div class="qrg-tip">
                💡 <strong>Tip:</strong> QR kód může obsahovat URL, text, email, telefonní číslo, SMS, WiFi heslo a další. Stačí vložit správný formát.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const textInput = document.getElementById('qrg-text');
    const sizeInput = document.getElementById('qrg-size');
    const sizeMinus = document.getElementById('qrg-size-minus');
    const sizePlus = document.getElementById('qrg-size-plus');
    const bgColorInput = document.getElementById('qrg-bg-color');
    const fgColorInput = document.getElementById('qrg-fg-color');
    const generateBtn = document.getElementById('qrg-generate');
    const downloadBtn = document.getElementById('qrg-download');
    const copyBtn = document.getElementById('qrg-copy');
    const qrcodeDiv = document.getElementById('qrg-qrcode');

    let currentQRCode = null;
    let currentText = '';

    // Velikost +/-
    sizeMinus.addEventListener('click', () => {
        let val = parseInt(sizeInput.value) || 200;
        if (val > 100) sizeInput.value = val - 10;
        saveSettings();
    });

    sizePlus.addEventListener('click', () => {
        let val = parseInt(sizeInput.value) || 200;
        if (val < 500) sizeInput.value = val + 10;
        saveSettings();
    });

    sizeInput.addEventListener('change', () => {
        let val = parseInt(sizeInput.value);
        if (val < 100) sizeInput.value = 100;
        if (val > 500) sizeInput.value = 500;
        if (currentText) generateQR();
        saveSettings();
    });

    // Generování QR kódu
    function generateQR() {
        const text = textInput.value.trim();
        const size = parseInt(sizeInput.value) || 200;
        const bgColor = bgColorInput.value;
        const fgColor = fgColorInput.value;

        if (!text) {
            showNotification('Zadej text nebo URL', 'warning');
            qrcodeDiv.innerHTML = '<div class="qrg-empty">Zadej text a klikni na "Generovat"</div>';
            downloadBtn.disabled = true;
            copyBtn.disabled = true;
            return;
        }

        currentText = text;
        
        // Vyčištění starého QR kódu
        qrcodeDiv.innerHTML = '';
        
        try {
            // Vytvoření nového QR kódu
            currentQRCode = new QRCode(qrcodeDiv, {
                text: text,
                width: size,
                height: size,
                colorDark: fgColor,
                colorLight: bgColor,
                correctLevel: QRCode.CorrectLevel.H
            });
            
            downloadBtn.disabled = false;
            copyBtn.disabled = false;
            showNotification('QR kód vygenerován', 'success');
        } catch (error) {
            console.error('Chyba při generování QR kódu:', error);
            qrcodeDiv.innerHTML = '<div class="qrg-empty">❌ Chyba při generování QR kódu. Text je příliš dlouhý nebo neplatný.</div>';
            downloadBtn.disabled = true;
            copyBtn.disabled = true;
        }
    }

    // Stažení QR kódu
    function downloadQR() {
        if (!currentQRCode) {
            showNotification('Nejprve vygeneruj QR kód', 'warning');
            return;
        }
        
        const canvas = qrcodeDiv.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `qrcode_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showNotification('QR kód stažen', 'success');
        } else {
            showNotification('Nepodařilo se stáhnout QR kód', 'error');
        }
    }

    // Kopírování textu
    async function copyText() {
        if (currentText) {
            await copyToClipboard(currentText);
        } else {
            showNotification('Žádný text ke kopírování', 'warning');
        }
    }

    // Eventy
    generateBtn.addEventListener('click', generateQR);
    downloadBtn.addEventListener('click', downloadQR);
    copyBtn.addEventListener('click', copyText);
    
    textInput.addEventListener('input', () => {
        saveSettings();
    });
    
    bgColorInput.addEventListener('input', () => {
        if (currentText) generateQR();
        saveSettings();
    });
    
    fgColorInput.addEventListener('input', () => {
        if (currentText) generateQR();
        saveSettings();
    });

    // Ukládání/načítání
    function saveSettings() {
        storage.set('text', textInput.value);
        storage.set('size', sizeInput.value);
        storage.set('bgColor', bgColorInput.value);
        storage.set('fgColor', fgColorInput.value);
    }

    function loadSettings() {
        const savedText = storage.get('text', '');
        textInput.value = savedText;
        sizeInput.value = storage.get('size', 200);
        bgColorInput.value = storage.get('bgColor', '#ffffff');
        fgColorInput.value = storage.get('fgColor', '#000000');
        
        if (savedText) {
            setTimeout(() => generateQR(), 100);
        }
    }

    loadSettings();
}

export function cleanup() {
    console.log('QR Generator se zavírá');
}