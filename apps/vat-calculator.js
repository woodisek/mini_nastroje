import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('vat-calculator');

export default function render(container) {
    container.innerHTML = `
        <div class="vat-calculator">
            <div class="vc-header">
                <span class="vc-icon">🧾</span>
                <div>
                    <h3>Kalkulačka DPH</h3>
                    <p>Výpočet daně pro české sazby (21%, 12%, 0%)</p>
                </div>
            </div>

            <!-- Částka -->
            <div class="vc-section">
                <label class="vc-label">💰 Částka</label>
                <div class="vc-input-group">
                    <input type="number" id="vc-amount" class="vc-input" value="1000" step="100">
                    <span class="vc-currency">Kč</span>
                </div>
            </div>

            <!-- Sazba DPH -->
            <div class="vc-section">
                <label class="vc-label">📊 Sazba DPH</label>
                <div class="vc-vat-buttons">
                    <button data-vat="21" class="vc-vat-btn active">21%</button>
                    <button data-vat="12" class="vc-vat-btn">12%</button>
                    <button data-vat="0" class="vc-vat-btn">0%</button>
                </div>
            </div>

            <!-- Režim výpočtu -->
            <div class="vc-section">
                <label class="vc-label">⚙️ Režim výpočtu</label>
                <div class="vc-modes">
                    <button data-mode="from-net" class="vc-mode-btn active">💰 Z ceny bez DPH</button>
                    <button data-mode="from-gross" class="vc-mode-btn">💵 Z ceny s DPH</button>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="vc-buttons">
                <button id="vc-calculate" class="vc-btn vc-btn-primary">🧮 Vypočítat DPH</button>
                <button id="vc-clear" class="vc-btn vc-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="vc-result-section">
                <div class="vc-result-header">
                    <span>📊 Výsledek</span>
                    <button id="vc-copy" class="vc-small-btn">📋 Kopírovat</button>
                </div>
                <div id="vc-result" class="vc-result">
                    <div class="vc-empty">Zadej částku a klikni na "Vypočítat DPH"</div>
                </div>
            </div>

            <!-- Tabulka sazeb -->
            <details class="vc-details">
                <summary>📋 Tabulka sazeb DPH v ČR</summary>
                <div class="vc-table">
                    <div class="vc-table-row vc-table-header">
                        <span>Sazba</span>
                        <span>Použití</span>
                    </div>
                    <div class="vc-table-row">
                        <span>21%</span>
                        <span>Základní sazba – většina zboží a služeb</span>
                    </div>
                    <div class="vc-table-row">
                        <span>12%</span>
                        <span>Snížená sazba – potraviny, léky, knihy, ubytování</span>
                    </div>
                    <div class="vc-table-row">
                        <span>0%</span>
                        <span>Nulová sazba – vývoz, mezinárodní doprava</span>
                    </div>
                </div>
            </details>

            <!-- Tip -->
            <div class="vc-tip">
                💡 <strong>Tip:</strong> Kalkulačka počítá DPH podle českých sazeb. Můžeš zadat cenu s DPH nebo bez DPH.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const amountInput = document.getElementById('vc-amount');
    const vatBtns = document.querySelectorAll('.vc-vat-btn');
    const modeBtns = document.querySelectorAll('.vc-mode-btn');
    const calculateBtn = document.getElementById('vc-calculate');
    const clearBtn = document.getElementById('vc-clear');
    const copyBtn = document.getElementById('vc-copy');
    const resultDiv = document.getElementById('vc-result');

    let currentVat = 21;
    let currentMode = 'from-net'; // from-net = z ceny bez DPH, from-gross = z ceny s DPH

    function calculateVat() {
        const amount = parseFloat(amountInput.value) || 0;
        
        if (amount <= 0) {
            resultDiv.innerHTML = '<div class="vc-error">❌ Zadej platnou částku</div>';
            return;
        }
        
        let net, vat, gross;
        
        if (currentMode === 'from-net') {
            // Zadána cena bez DPH
            net = amount;
            vat = net * (currentVat / 100);
            gross = net + vat;
        } else {
            // Zadána cena s DPH
            gross = amount;
            net = gross / (1 + currentVat / 100);
            vat = gross - net;
        }
        
        // Zaokrouhlení na 2 desetinná místa
        net = Math.round(net * 100) / 100;
        vat = Math.round(vat * 100) / 100;
        gross = Math.round(gross * 100) / 100;
        
        // Barevné zvýraznění podle sazby
        let vatColor = '';
        if (currentVat === 21) vatColor = '#f44336';
        else if (currentVat === 12) vatColor = '#ff9800';
        else vatColor = '#4caf50';
        
        resultDiv.innerHTML = `
            <div class="vc-result-card">
                <div class="vc-result-row">
                    <span class="vc-result-label">💰 Cena bez DPH:</span>
                    <span class="vc-result-value">${net.toFixed(2)} Kč</span>
                </div>
                <div class="vc-result-row vc-vat-row" style="border-left: 4px solid ${vatColor}">
                    <span class="vc-result-label">🧾 DPH (${currentVat}%):</span>
                    <span class="vc-result-value vc-vat-amount" style="color: ${vatColor}">${vat.toFixed(2)} Kč</span>
                </div>
                <div class="vc-result-row">
                    <span class="vc-result-label">💵 Cena s DPH:</span>
                    <span class="vc-result-value">${gross.toFixed(2)} Kč</span>
                </div>
            </div>
        `;
        
        showNotification(`DPH ${currentVat}% spočítáno`, 'success');
        saveSettings();
    }

    async function copyResult() {
        const resultText = resultDiv.innerText;
        if (resultText && !resultText.includes('Zadej platnou částku') && !resultText.includes('Vyber sazbu')) {
            await copyToClipboard(resultText);
            showNotification('Výsledek zkopírován');
        } else {
            showNotification('Nejprve spočítej DPH', 'warning');
        }
    }

    function clearAll() {
        amountInput.value = '1000';
        currentVat = 21;
        currentMode = 'from-net';
        
        vatBtns.forEach(btn => {
            if (btn.dataset.vat == 21) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        modeBtns.forEach(btn => {
            if (btn.dataset.mode === 'from-net') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        resultDiv.innerHTML = '<div class="vc-empty">Zadej částku a klikni na "Vypočítat DPH"</div>';
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Eventy
    vatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            vatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentVat = parseInt(btn.dataset.vat);
            if (amountInput.value && amountInput.value !== '0') {
                calculateVat();
            }
            saveSettings();
        });
    });
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            if (amountInput.value && amountInput.value !== '0') {
                calculateVat();
            }
            saveSettings();
        });
    });
    
    calculateBtn.addEventListener('click', calculateVat);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    
    amountInput.addEventListener('input', () => {
        if (amountInput.value) saveSettings();
    });
    
    // Enter klávesa
    amountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateVat();
    });
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('amount', amountInput.value);
        storage.set('vat', currentVat);
        storage.set('mode', currentMode);
    }
    
    function loadSettings() {
        const savedAmount = storage.get('amount', '1000');
        const savedVat = storage.get('vat', 21);
        const savedMode = storage.get('mode', 'from-net');
        
        amountInput.value = savedAmount;
        currentVat = savedVat;
        currentMode = savedMode;
        
        vatBtns.forEach(btn => {
            if (parseInt(btn.dataset.vat) === savedVat) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        modeBtns.forEach(btn => {
            if (btn.dataset.mode === savedMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        if (savedAmount && savedAmount !== '0') {
            setTimeout(() => calculateVat(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('VAT Calculator se zavírá');
}