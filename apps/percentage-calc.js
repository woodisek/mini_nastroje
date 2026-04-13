import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('percentage-calc');

export default function render(container) {
    container.innerHTML = `
        <div class="percentage-calc">
            <div class="pc-header">
                <span class="pc-icon">📊</span>
                <div>
                    <h3>Procentní kalkulačka</h3>
                    <p>Rychlé výpočty procent, slev a DPH</p>
                </div>
            </div>

            <!-- Přepínání režimů -->
            <div class="pc-modes">
                <button data-mode="basic" class="pc-mode-btn active">📐 Základní</button>
                <button data-mode="discount" class="pc-mode-btn">🏷️ Sleva / Navýšení</button>
                <button data-mode="vat" class="pc-mode-btn">🧾 DPH</button>
                <button data-mode="change" class="pc-mode-btn">📈 Procentuální změna</button>
            </div>

            <!-- Režim 1: Základní (x% z y) -->
            <div id="pc-mode-basic" class="pc-mode-content active">
                <div class="pc-section">
                    <label class="pc-label">📊 Kolik procent?</label>
                    <div class="pc-input-wrapper">
                        <input type="number" id="pc-basic-percent" class="pc-input" value="20" step="any">
                        <span class="pc-suffix">%</span>
                    </div>
                </div>
                <div class="pc-section">
                    <label class="pc-label">💰 Z jaké částky?</label>
                    <div class="pc-input-wrapper">
                        <input type="number" id="pc-basic-value" class="pc-input" value="5000" step="any">
                        <span class="pc-suffix">Kč</span>
                    </div>
                </div>
                <div class="pc-result-box">
                    <div class="pc-result-label">Výsledek:</div>
                    <div class="pc-result-value" id="pc-basic-result">1 000 Kč</div>
                </div>
                <button id="pc-basic-copy" class="pc-small-copy">📋 Kopírovat výsledek</button>
            </div>

            <!-- Režim 2: Sleva / Navýšení -->
            <div id="pc-mode-discount" class="pc-mode-content">
                <div class="pc-section">
                    <label class="pc-label">💰 Původní cena</label>
                    <div class="pc-input-wrapper">
                        <input type="number" id="pc-discount-original" class="pc-input" value="5000" step="any">
                        <span class="pc-suffix">Kč</span>
                    </div>
                </div>
                <div class="pc-section">
                    <label class="pc-label">📉 Procenta ( + = navýšení, - = sleva )</label>
                    <div class="pc-input-wrapper">
                        <input type="number" id="pc-discount-percent" class="pc-input" value="20" step="any">
                        <span class="pc-suffix">%</span>
                    </div>
                </div>
                <div class="pc-result-box">
                    <div class="pc-result-label">Výsledná cena:</div>
                    <div class="pc-result-value" id="pc-discount-result">4 000 Kč</div>
                </div>
                <div class="pc-result-box pc-result-secondary">
                    <div class="pc-result-label">Změna:</div>
                    <div class="pc-result-value" id="pc-discount-change">-1 000 Kč</div>
                </div>
                <button id="pc-discount-copy" class="pc-small-copy">📋 Kopírovat výsledek</button>
            </div>

            <!-- Režim 3: DPH -->
            <div id="pc-mode-vat" class="pc-mode-content">
                <div class="pc-section">
                    <label class="pc-label">💰 Částka bez DPH / s DPH</label>
                    <div class="pc-input-wrapper">
                        <input type="number" id="pc-vat-amount" class="pc-input" value="5000" step="any">
                        <span class="pc-suffix">Kč</span>
                    </div>
                </div>
                <div class="pc-section">
                    <label class="pc-label">🧾 Sazba DPH</label>
                    <div class="pc-vat-buttons">
                        <button data-vat="21" class="pc-vat-btn active">21%</button>
                        <button data-vat="15" class="pc-vat-btn">15%</button>
                        <button data-vat="12" class="pc-vat-btn">12%</button>
                        <button data-vat="10" class="pc-vat-btn">10%</button>
                        <button data-vat="0" class="pc-vat-btn">0%</button>
                    </div>
                    <div class="pc-vat-custom">
                        <input type="number" id="pc-vat-custom" class="pc-input-small" placeholder="Vlastní" step="any">
                        <span class="pc-suffix">%</span>
                    </div>
                </div>
                <div class="pc-switch">
                    <label class="pc-radio-label">
                        <input type="radio" name="vat-mode" value="exclude" checked> 🔽 Počítám z ceny bez DPH
                    </label>
                    <label class="pc-radio-label">
                        <input type="radio" name="vat-mode" value="include"> 🔼 Počítám z ceny s DPH
                    </label>
                </div>
                <div class="pc-result-box">
                    <div class="pc-result-label" id="pc-vat-label">Cena s DPH:</div>
                    <div class="pc-result-value" id="pc-vat-result">6 050 Kč</div>
                </div>
                <div class="pc-result-box pc-result-secondary">
                    <div class="pc-result-label">Výše DPH:</div>
                    <div class="pc-result-value" id="pc-vat-tax">1 050 Kč</div>
                </div>
                <button id="pc-vat-copy" class="pc-small-copy">📋 Kopírovat výsledek</button>
            </div>

            <!-- Režim 4: Procentuální změna -->
            <div id="pc-mode-change" class="pc-mode-content">
                <div class="pc-section">
                    <label class="pc-label">📉 Původní hodnota</label>
                    <div class="pc-input-wrapper">
                        <input type="number" id="pc-change-old" class="pc-input" value="5000" step="any">
                        <span class="pc-suffix">Kč</span>
                    </div>
                </div>
                <div class="pc-section">
                    <label class="pc-label">📈 Nová hodnota</label>
                    <div class="pc-input-wrapper">
                        <input type="number" id="pc-change-new" class="pc-input" value="6000" step="any">
                        <span class="pc-suffix">Kč</span>
                    </div>
                </div>
                <div class="pc-result-box">
                    <div class="pc-result-label">Procentuální změna:</div>
                    <div class="pc-result-value" id="pc-change-result">+20%</div>
                </div>
                <div class="pc-result-box pc-result-secondary">
                    <div class="pc-result-label">Absolutní změna:</div>
                    <div class="pc-result-value" id="pc-change-absolute">+1 000 Kč</div>
                </div>
                <button id="pc-change-copy" class="pc-small-copy">📋 Kopírovat výsledek</button>
            </div>

            <!-- Tip -->
            <div class="pc-tip">
                💡 <strong>Tip:</strong> Můžeš použít desetinná čísla (např. 12.5%). Výsledky se automaticky aktualizují.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const modeBtns = document.querySelectorAll('.pc-mode-btn');
    const modeContents = document.querySelectorAll('.pc-mode-content');
    
    // Režim 1 - Základní
    const basicPercent = document.getElementById('pc-basic-percent');
    const basicValue = document.getElementById('pc-basic-value');
    const basicResult = document.getElementById('pc-basic-result');
    const basicCopy = document.getElementById('pc-basic-copy');
    
    // Režim 2 - Sleva
    const discountOriginal = document.getElementById('pc-discount-original');
    const discountPercent = document.getElementById('pc-discount-percent');
    const discountResult = document.getElementById('pc-discount-result');
    const discountChange = document.getElementById('pc-discount-change');
    const discountCopy = document.getElementById('pc-discount-copy');
    
    // Režim 3 - DPH
    const vatAmount = document.getElementById('pc-vat-amount');
    const vatCustom = document.getElementById('pc-vat-custom');
    const vatBtns = document.querySelectorAll('.pc-vat-btn');
    const vatResult = document.getElementById('pc-vat-result');
    const vatTax = document.getElementById('pc-vat-tax');
    const vatLabel = document.getElementById('pc-vat-label');
    const vatCopy = document.getElementById('pc-vat-copy');
    let selectedVat = 21;
    
    // Režim 4 - Změna
    const changeOld = document.getElementById('pc-change-old');
    const changeNew = document.getElementById('pc-change-new');
    const changeResult = document.getElementById('pc-change-result');
    const changeAbsolute = document.getElementById('pc-change-absolute');
    const changeCopy = document.getElementById('pc-change-copy');
    
    // ========== FUNKCE ==========
    
    function formatNumber(value) {
        return new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
    }
    
    function formatCurrency(value) {
        return `${formatNumber(value)} Kč`;
    }
    
    // Režim 1 - Základní
    function calculateBasic() {
        const percent = parseFloat(basicPercent.value) || 0;
        const value = parseFloat(basicValue.value) || 0;
        const result = (percent / 100) * value;
        basicResult.textContent = formatCurrency(result);
    }
    
    basicPercent.addEventListener('input', calculateBasic);
    basicValue.addEventListener('input', calculateBasic);
    basicCopy.addEventListener('click', () => {
        copyToClipboard(basicResult.textContent);
    });
    
    // Režim 2 - Sleva / Navýšení
    function calculateDiscount() {
        const original = parseFloat(discountOriginal.value) || 0;
        const percent = parseFloat(discountPercent.value) || 0;
        const change = original * (percent / 100);
        const result = original + change;
        discountResult.textContent = formatCurrency(result);
        discountChange.textContent = `${percent >= 0 ? '+' : ''}${formatCurrency(change)}`;
        discountChange.parentElement.style.color = percent >= 0 ? '#4caf50' : '#f44336';
    }
    
    discountOriginal.addEventListener('input', calculateDiscount);
    discountPercent.addEventListener('input', calculateDiscount);
    discountCopy.addEventListener('click', () => {
        copyToClipboard(discountResult.textContent);
    });
    
    // Režim 3 - DPH
    function calculateVat() {
        const amount = parseFloat(vatAmount.value) || 0;
        const isExclude = document.querySelector('input[name="vat-mode"]:checked').value === 'exclude';
        const vatRate = selectedVat / 100;
        
        let priceWithVat, priceWithoutVat, vatAmount_result;
        
        if (isExclude) {
            priceWithoutVat = amount;
            vatAmount_result = amount * vatRate;
            priceWithVat = amount + vatAmount_result;
            vatLabel.textContent = '💰 Cena s DPH:';
            vatResult.textContent = formatCurrency(priceWithVat);
        } else {
            priceWithVat = amount;
            priceWithoutVat = amount / (1 + vatRate);
            vatAmount_result = amount - priceWithoutVat;
            vatLabel.textContent = '💰 Cena bez DPH:';
            vatResult.textContent = formatCurrency(priceWithoutVat);
        }
        vatTax.textContent = formatCurrency(vatAmount_result);
    }
    
    vatAmount.addEventListener('input', calculateVat);
    vatCustom.addEventListener('input', () => {
        const custom = parseFloat(vatCustom.value);
        if (!isNaN(custom)) {
            selectedVat = custom;
            vatBtns.forEach(btn => btn.classList.remove('active'));
            calculateVat();
        }
    });
    
    vatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            vatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedVat = parseInt(btn.dataset.vat);
            vatCustom.value = '';
            calculateVat();
            saveSettings();
        });
    });
    
    document.querySelectorAll('input[name="vat-mode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            calculateVat();
            saveSettings();
        });
    });
    
    vatCopy.addEventListener('click', () => {
        copyToClipboard(vatResult.textContent);
    });
    
    // Režim 4 - Změna
    function calculateChange() {
        const oldVal = parseFloat(changeOld.value) || 0;
        const newVal = parseFloat(changeNew.value) || 0;
        
        if (oldVal === 0) {
            changeResult.textContent = 'Nedefinováno';
            changeAbsolute.textContent = formatCurrency(newVal - oldVal);
            return;
        }
        
        const percentChange = ((newVal - oldVal) / oldVal) * 100;
        const absoluteChange = newVal - oldVal;
        
        const sign = percentChange >= 0 ? '+' : '';
        changeResult.textContent = `${sign}${formatNumber(percentChange)}%`;
        changeAbsolute.textContent = `${absoluteChange >= 0 ? '+' : ''}${formatCurrency(absoluteChange)}`;
        
        changeResult.style.color = percentChange >= 0 ? '#4caf50' : '#f44336';
        changeAbsolute.style.color = absoluteChange >= 0 ? '#4caf50' : '#f44336';
    }
    
    changeOld.addEventListener('input', calculateChange);
    changeNew.addEventListener('input', calculateChange);
    changeCopy.addEventListener('click', () => {
        copyToClipboard(changeResult.textContent);
    });
    
    // ========== PŘEPÍNÁNÍ REŽIMŮ ==========
    function switchMode(mode) {
        modeContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`pc-mode-${mode}`).classList.add('active');
        
        modeBtns.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        saveSettings();
    }
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchMode(btn.dataset.mode);
        });
    });
    
    // ========== UKLÁDÁNÍ ==========
    function saveSettings() {
        const activeMode = document.querySelector('.pc-mode-btn.active').dataset.mode;
        storage.set('activeMode', activeMode);
        storage.set('basicPercent', basicPercent.value);
        storage.set('basicValue', basicValue.value);
        storage.set('discountOriginal', discountOriginal.value);
        storage.set('discountPercent', discountPercent.value);
        storage.set('vatAmount', vatAmount.value);
        storage.set('vatRate', selectedVat);
        storage.set('vatMode', document.querySelector('input[name="vat-mode"]:checked').value);
        storage.set('changeOld', changeOld.value);
        storage.set('changeNew', changeNew.value);
    }
    
    function loadSettings() {
        const savedMode = storage.get('activeMode', 'basic');
        basicPercent.value = storage.get('basicPercent', 20);
        basicValue.value = storage.get('basicValue', 5000);
        discountOriginal.value = storage.get('discountOriginal', 5000);
        discountPercent.value = storage.get('discountPercent', 20);
        vatAmount.value = storage.get('vatAmount', 5000);
        const savedVat = storage.get('vatRate', 21);
        selectedVat = savedVat;
        const savedVatMode = storage.get('vatMode', 'exclude');
        changeOld.value = storage.get('changeOld', 5000);
        changeNew.value = storage.get('changeNew', 6000);
        
        // Nastavení aktivního VAT tlačítka
        let vatFound = false;
        vatBtns.forEach(btn => {
            if (parseInt(btn.dataset.vat) === savedVat) {
                btn.classList.add('active');
                vatFound = true;
            } else {
                btn.classList.remove('active');
            }
        });
        if (!vatFound && savedVat) {
            vatCustom.value = savedVat;
        }
        
        // Nastavení VAT módu
        const vatModeRadio = document.querySelector(`input[name="vat-mode"][value="${savedVatMode}"]`);
        if (vatModeRadio) vatModeRadio.checked = true;
        
        // Přepnutí do uloženého režimu
        switchMode(savedMode);
        
        // Výpočty
        calculateBasic();
        calculateDiscount();
        calculateVat();
        calculateChange();
    }
    
    // Auto-save při změnách
    basicPercent.addEventListener('input', saveSettings);
    basicValue.addEventListener('input', saveSettings);
    discountOriginal.addEventListener('input', saveSettings);
    discountPercent.addEventListener('input', saveSettings);
    vatAmount.addEventListener('input', saveSettings);
    changeOld.addEventListener('input', saveSettings);
    changeNew.addEventListener('input', saveSettings);
    vatCustom.addEventListener('input', () => {
        if (vatCustom.value) {
            selectedVat = parseFloat(vatCustom.value);
            calculateVat();
            saveSettings();
        }
    });
    
    loadSettings();
}

export function cleanup() {
    console.log('Percentage Calculator se zavírá');
}