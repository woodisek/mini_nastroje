import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('random-number');

export default function render(container) {
    container.innerHTML = `
        <div class="random-number">
            <div class="rn-header">
                <span class="rn-icon">🎲</span>
                <div>
                    <h3>Generátor náhodných čísel</h3>
                    <p>Náhodná čísla v libovolném rozsahu</p>
                </div>
            </div>

            <!-- Rozsah -->
            <div class="rn-section">
                <div class="rn-range">
                    <div class="rn-range-input">
                        <label class="rn-label">Od</label>
                        <div class="rn-input-wrapper">
                            <input type="number" id="rn-min" class="rn-input" value="1" step="1">
                        </div>
                    </div>
                    <div class="rn-range-sep">—</div>
                    <div class="rn-range-input">
                        <label class="rn-label">Do</label>
                        <div class="rn-input-wrapper">
                            <input type="number" id="rn-max" class="rn-input" value="100" step="1">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Počet čísel -->
            <div class="rn-section">
                <label class="rn-label">🔢 Počet čísel</label>
                <div class="rn-count-control">
                    <button id="rn-count-minus" class="rn-count-btn">−</button>
                    <input type="number" id="rn-count" class="rn-count-input" value="1" min="1" max="100" step="1">
                    <button id="rn-count-plus" class="rn-count-btn">+</button>
                </div>
                <div class="rn-hint">Až 100 čísel najednou</div>
            </div>

            <!-- Možnosti -->
            <div class="rn-section">
                <label class="rn-label">⚙️ Možnosti</label>
                <div class="rn-options">
                    <label class="rn-checkbox">
                        <input type="checkbox" id="rn-unique">
                        <span>🔢 Unikátní čísla (bez opakování)</span>
                    </label>
                    <label class="rn-checkbox">
                        <input type="checkbox" id="rn-sort">
                        <span>📊 Seřadit vzestupně</span>
                    </label>
                    <label class="rn-checkbox">
                        <input type="checkbox" id="rn-decimals">
                        <span>🔢 Desetinná čísla</span>
                    </label>
                </div>
            </div>

            <!-- Desetinná místa (zobrazí se jen když je zaškrtnuto) -->
            <div id="rn-decimals-options" class="rn-section" style="display: none;">
                <label class="rn-label">🔢 Počet desetinných míst</label>
                <div class="rn-count-control">
                    <button id="rn-decimals-minus" class="rn-count-btn">−</button>
                    <input type="number" id="rn-decimals-count" class="rn-count-input" value="2" min="0" max="5" step="1">
                    <button id="rn-decimals-plus" class="rn-count-btn">+</button>
                </div>
            </div>

            <!-- Tlačítko Generovat -->
            <button id="rn-generate" class="rn-btn rn-btn-primary">🎲 Generovat číslo</button>

            <!-- Výsledek -->
            <div class="rn-result-section">
                <div class="rn-result-header">
                    <span>📊 Výsledek</span>
                    <button id="rn-copy" class="rn-small-btn">📋 Kopírovat</button>
                    <button id="rn-clear" class="rn-small-btn">🗑️ Vyčistit</button>
                </div>
                <div id="rn-result" class="rn-result">
                    <div class="rn-empty">Klikni na "Generovat"</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="rn-tip">
                💡 <strong>Tip:</strong> Můžeš generovat až 100 náhodných čísel najednou. Zaškrtni "Unikátní čísla" pro vyloučení opakování.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const minInput = document.getElementById('rn-min');
    const maxInput = document.getElementById('rn-max');
    const countInput = document.getElementById('rn-count');
    const countMinus = document.getElementById('rn-count-minus');
    const countPlus = document.getElementById('rn-count-plus');
    const uniqueCheck = document.getElementById('rn-unique');
    const sortCheck = document.getElementById('rn-sort');
    const decimalsCheck = document.getElementById('rn-decimals');
    const decimalsOptions = document.getElementById('rn-decimals-options');
    const decimalsCount = document.getElementById('rn-decimals-count');
    const decimalsMinus = document.getElementById('rn-decimals-minus');
    const decimalsPlus = document.getElementById('rn-decimals-plus');
    const generateBtn = document.getElementById('rn-generate');
    const copyBtn = document.getElementById('rn-copy');
    const clearBtn = document.getElementById('rn-clear');
    const resultDiv = document.getElementById('rn-result');

    let currentNumbers = [];

    // Zobrazení/skrytí možností desetinných míst
    decimalsCheck.addEventListener('change', () => {
        decimalsOptions.style.display = decimalsCheck.checked ? 'block' : 'none';
        saveSettings();
    });

    // Počítadlo pro počet čísel
    countMinus.addEventListener('click', () => {
        let val = parseInt(countInput.value) || 1;
        if (val > 1) countInput.value = val - 1;
        saveSettings();
    });

    countPlus.addEventListener('click', () => {
        let val = parseInt(countInput.value) || 1;
        if (val < 100) countInput.value = val + 1;
        saveSettings();
    });

    // Počítadlo pro desetinná místa
    decimalsMinus.addEventListener('click', () => {
        let val = parseInt(decimalsCount.value) || 2;
        if (val > 0) decimalsCount.value = val - 1;
        generateNumbers();
        saveSettings();
    });

    decimalsPlus.addEventListener('click', () => {
        let val = parseInt(decimalsCount.value) || 2;
        if (val < 5) decimalsCount.value = val + 1;
        generateNumbers();
        saveSettings();
    });

    function formatNumber(num) {
        if (decimalsCheck.checked) {
            const decimals = parseInt(decimalsCount.value) || 2;
            return num.toFixed(decimals);
        }
        return Math.round(num).toString();
    }

    function generateNumbers() {
        let min = parseFloat(minInput.value);
        let max = parseFloat(maxInput.value);
        let count = parseInt(countInput.value) || 1;
        const unique = uniqueCheck.checked;
        const sort = sortCheck.checked;

        // Validace
        if (isNaN(min)) min = 0;
        if (isNaN(max)) max = 100;
        if (min > max) {
            [min, max] = [max, min];
            minInput.value = min;
            maxInput.value = max;
        }

        // Omezení počtu pro unikátní čísla
        const maxUnique = Math.floor(Math.abs(max - min)) + 1;
        if (unique && count > maxUnique && !decimalsCheck.checked) {
            count = maxUnique;
            countInput.value = count;
            showNotification(`Maximální počet unikátních čísel je ${maxUnique}`, 'warning');
        }

        const numbers = [];
        const used = new Set();

        for (let i = 0; i < count; i++) {
            let randomNum;
            let attempts = 0;
            do {
                if (decimalsCheck.checked) {
                    randomNum = min + Math.random() * (max - min);
                } else {
                    randomNum = Math.floor(min + Math.random() * (max - min + 1));
                }
                attempts++;
                if (attempts > 1000) break;
            } while (unique && used.has(randomNum));

            if (unique) used.add(randomNum);
            numbers.push(randomNum);
        }

        if (sort) {
            numbers.sort((a, b) => a - b);
        }

        currentNumbers = numbers;

        // Zobrazení
        if (numbers.length === 0) {
            resultDiv.innerHTML = '<div class="rn-empty">Žádná čísla ke zobrazení</div>';
            return;
        }

        const formattedNumbers = numbers.map(n => formatNumber(n));
        
        // Zobrazení jako grid nebo sloupec
        if (numbers.length <= 10) {
            resultDiv.innerHTML = formattedNumbers.map(n => 
                `<div class="rn-number-card">${n}</div>`
            ).join('');
        } else {
            resultDiv.innerHTML = formattedNumbers.map(n => 
                `<div class="rn-number-item">${n}</div>`
            ).join('');
        }
    }

    async function copyResult() {
        if (currentNumbers.length === 0) {
            showNotification('Žádná čísla ke kopírování', 'warning');
            return;
        }

        const text = currentNumbers.map(n => formatNumber(n)).join('\n');
        await copyToClipboard(text);
        showNotification(`Zkopírováno ${currentNumbers.length} čísel`);
    }

    function clearResult() {
        currentNumbers = [];
        resultDiv.innerHTML = '<div class="rn-empty">Klikni na "Generovat"</div>';
        showNotification('Vyčištěno');
    }

    // Eventy
    generateBtn.addEventListener('click', generateNumbers);
    copyBtn.addEventListener('click', copyResult);
    clearBtn.addEventListener('click', clearResult);
    
    minInput.addEventListener('input', () => {
        generateNumbers();
        saveSettings();
    });
    maxInput.addEventListener('input', () => {
        generateNumbers();
        saveSettings();
    });
    countInput.addEventListener('input', () => {
        let val = parseInt(countInput.value);
        if (val > 100) countInput.value = 100;
        if (val < 1) countInput.value = 1;
        generateNumbers();
        saveSettings();
    });
    uniqueCheck.addEventListener('change', () => {
        generateNumbers();
        saveSettings();
    });
    sortCheck.addEventListener('change', () => {
        generateNumbers();
        saveSettings();
    });
    decimalsCheck.addEventListener('change', () => {
        generateNumbers();
        saveSettings();
    });
    decimalsCount.addEventListener('input', () => {
        generateNumbers();
        saveSettings();
    });

    // Ukládání/načítání
    function saveSettings() {
        storage.set('min', minInput.value);
        storage.set('max', maxInput.value);
        storage.set('count', countInput.value);
        storage.set('unique', uniqueCheck.checked);
        storage.set('sort', sortCheck.checked);
        storage.set('decimals', decimalsCheck.checked);
        storage.set('decimalsCount', decimalsCount.value);
    }

    function loadSettings() {
        minInput.value = storage.get('min', 1);
        maxInput.value = storage.get('max', 100);
        countInput.value = storage.get('count', 1);
        uniqueCheck.checked = storage.get('unique', false);
        sortCheck.checked = storage.get('sort', false);
        decimalsCheck.checked = storage.get('decimals', false);
        decimalsCount.value = storage.get('decimalsCount', 2);
        
        decimalsOptions.style.display = decimalsCheck.checked ? 'block' : 'none';
        
        generateNumbers();
    }

    loadSettings();
}

export function cleanup() {
    console.log('Random Number Generator se zavírá');
}