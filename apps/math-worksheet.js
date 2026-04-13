import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('math-worksheet');

export default function render(container) {
    container.innerHTML = `
        <div class="math-worksheet">
            <div class="mw-header">
                <span class="mw-icon">🧮</span>
                <div>
                    <h3>Nekonečné pětiminutovky</h3>
                    <p>Generování příkladů na +, -, ×, ÷</p>
                </div>
            </div>

            <!-- Nastavení -->
            <div class="mw-section">
                <label class="mw-label">⚙️ Nastavení příkladů</label>
                <div class="mw-options">
                    <label class="mw-checkbox">
                        <input type="checkbox" id="mw-add" checked>
                        <span>Sčítání (+)</span>
                    </label>
                    <label class="mw-checkbox">
                        <input type="checkbox" id="mw-sub" checked>
                        <span>Odčítání (-)</span>
                    </label>
                    <label class="mw-checkbox">
                        <input type="checkbox" id="mw-mul" checked>
                        <span>Násobení (×)</span>
                    </label>
                    <label class="mw-checkbox">
                        <input type="checkbox" id="mw-div" checked>
                        <span>Dělení (÷)</span>
                    </label>
                </div>
            </div>

            <div class="mw-section">
                <label class="mw-label">🔢 Rozsah čísel</label>
                <div class="mw-range">
                    <div class="mw-range-input">
                        <span>Od:</span>
                        <input type="number" id="mw-min" class="mw-input-small" value="1" min="0" max="100">
                    </div>
                    <div class="mw-range-input">
                        <span>Do:</span>
                        <input type="number" id="mw-max" class="mw-input-small" value="20" min="1" max="100">
                    </div>
                </div>
                <div class="mw-hint">Čísla budou v tomto rozsahu (pro násobení max 20)</div>
            </div>

            <div class="mw-section">
                <label class="mw-label">🔢 Počet příkladů</label>
                <div class="mw-count-control">
                    <button id="mw-count-minus" class="mw-count-btn">−</button>
                    <input type="number" id="mw-count" class="mw-count-input" value="40" min="5" max="100" step="5">
                    <button id="mw-count-plus" class="mw-count-btn">+</button>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="mw-buttons">
                <button id="mw-generate" class="mw-btn mw-btn-primary">📝 Generovat příklady</button>
                <button id="mw-key" class="mw-btn mw-btn-secondary">🔑 Vygenerovat klíč</button>
                <button id="mw-clear" class="mw-btn mw-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Příklady -->
            <div class="mw-result-section">
                <div class="mw-result-header">
                    <span>📝 Příklady</span>
                    <button id="mw-copy-examples" class="mw-small-btn">📋 Kopírovat příklady</button>
                    <button id="mw-copy-key" class="mw-small-btn">📋 Kopírovat klíč</button>
                </div>
                <div id="mw-examples" class="mw-examples">
                    <div class="mw-empty">Klikni na "Generovat příklady"</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="mw-tip">
                💡 <strong>Tip:</strong> Vygeneruj si 40 příkladů na pět minut. Druhé tlačítko vytvoří klíč pro rychlou kontrolu.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const addCheck = document.getElementById('mw-add');
    const subCheck = document.getElementById('mw-sub');
    const mulCheck = document.getElementById('mw-mul');
    const divCheck = document.getElementById('mw-div');
    const minInput = document.getElementById('mw-min');
    const maxInput = document.getElementById('mw-max');
    const countInput = document.getElementById('mw-count');
    const countMinus = document.getElementById('mw-count-minus');
    const countPlus = document.getElementById('mw-count-plus');
    const generateBtn = document.getElementById('mw-generate');
    const keyBtn = document.getElementById('mw-key');
    const clearBtn = document.getElementById('mw-clear');
    const copyExamplesBtn = document.getElementById('mw-copy-examples');
    const copyKeyBtn = document.getElementById('mw-copy-key');
    const examplesDiv = document.getElementById('mw-examples');

    let currentExamples = [];
    let currentKey = [];

    // Generování náhodného čísla v rozsahu
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Kontrola dělení (aby bylo celé)
    function getDivisionPair(max) {
        const divisor = randomInt(2, Math.min(max, 12));
        const quotient = randomInt(2, Math.floor(max / divisor));
        const dividend = divisor * quotient;
        return { first: dividend, second: divisor, result: quotient };
    }

    // Generování příkladu
    function generateExample(ops, min, max) {
        const availableOps = [];
        if (addCheck.checked && ops.includes('add')) availableOps.push('add');
        if (subCheck.checked && ops.includes('sub')) availableOps.push('sub');
        if (mulCheck.checked && ops.includes('mul')) availableOps.push('mul');
        if (divCheck.checked && ops.includes('div')) availableOps.push('div');
        
        if (availableOps.length === 0) return null;
        
        const op = availableOps[Math.floor(Math.random() * availableOps.length)];
        
        if (op === 'add') {
            const a = randomInt(min, max);
            const b = randomInt(min, max);
            return { text: `${a} + ${b} = ______`, result: a + b, op: '+' };
        } else if (op === 'sub') {
            const a = randomInt(min, max);
            const b = randomInt(min, a);
            return { text: `${a} - ${b} = ______`, result: a - b, op: '-' };
        } else if (op === 'mul') {
            const maxMul = Math.min(max, 20);
            const a = randomInt(1, maxMul);
            const b = randomInt(1, maxMul);
            return { text: `${a} × ${b} = ______`, result: a * b, op: '×' };
        } else if (op === 'div') {
            const { first, second, result } = getDivisionPair(Math.min(max, 100));
            return { text: `${first} ÷ ${second} = ______`, result: result, op: '÷' };
        }
        return null;
    }

    function generateWorksheet() {
        const min = parseInt(minInput.value) || 1;
        let max = parseInt(maxInput.value) || 20;
        const count = parseInt(countInput.value) || 40;
        
        if (min >= max) {
            showNotification('"Od" musí být menší než "Do"', 'warning');
            return;
        }
        
        // Kontrola zda je vybrána alespoň jedna operace
        if (!addCheck.checked && !subCheck.checked && !mulCheck.checked && !divCheck.checked) {
            showNotification('Vyber alespoň jednu operaci', 'warning');
            return;
        }
        
        currentExamples = [];
        currentKey = [];
        
        for (let i = 0; i < count; i++) {
            const example = generateExample(['add', 'sub', 'mul', 'div'], min, max);
            if (example) {
                currentExamples.push(example);
                currentKey.push({ text: example.text, result: example.result });
            }
        }
        
        displayExamples(currentExamples);
        showNotification(`Vygenerováno ${currentExamples.length} příkladů`, 'success');
        saveSettings();
    }

    function generateKey() {
        if (currentKey.length === 0) {
            showNotification('Nejprve vygeneruj příklady', 'warning');
            return;
        }
        
        const keyHtml = currentKey.map((item, idx) => `
            <div class="mw-key-item">
                <span class="mw-key-number">${idx + 1}.</span>
                <span class="mw-key-text">${item.text.replace('______', item.result)}</span>
            </div>
        `).join('');
        
        examplesDiv.innerHTML = `
            <div class="mw-key-header">🔑 KLÍČ K PŘÍKLADŮM</div>
            ${keyHtml}
        `;
        
        showNotification('Klíč vygenerován', 'success');
    }

    function displayExamples(examples) {
        if (examples.length === 0) {
            examplesDiv.innerHTML = '<div class="mw-empty">Klikni na "Generovat příklady"</div>';
            return;
        }
        
        // Zobrazení ve sloupcích (2 sloupce)
        const mid = Math.ceil(examples.length / 2);
        const leftCol = examples.slice(0, mid);
        const rightCol = examples.slice(mid);
        
        let html = '<div class="mw-examples-grid">';
        html += '<div class="mw-examples-col">';
        leftCol.forEach((ex, idx) => {
            html += `<div class="mw-example-item"><span class="mw-example-num">${idx + 1}.</span> ${ex.text}</div>`;
        });
        html += '</div><div class="mw-examples-col">';
        rightCol.forEach((ex, idx) => {
            html += `<div class="mw-example-item"><span class="mw-example-num">${mid + idx + 1}.</span> ${ex.text}</div>`;
        });
        html += '</div></div>';
        
        examplesDiv.innerHTML = html;
    }

    async function copyExamples() {
        if (currentExamples.length === 0) {
            showNotification('Žádné příklady ke kopírování', 'warning');
            return;
        }
        
        let text = 'MATEMATICKÉ PŘÍKLADY\n';
        text += '='.repeat(40) + '\n\n';
        currentExamples.forEach((ex, idx) => {
            text += `${idx + 1}. ${ex.text}\n`;
        });
        
        await copyToClipboard(text);
        showNotification('Příklady zkopírovány');
    }

    async function copyKey() {
        if (currentKey.length === 0) {
            showNotification('Nejprve vygeneruj příklady', 'warning');
            return;
        }
        
        let text = 'KLÍČ K PŘÍKLADŮM\n';
        text += '='.repeat(40) + '\n\n';
        currentKey.forEach((item, idx) => {
            text += `${idx + 1}. ${item.text.replace('______', item.result)}\n`;
        });
        
        await copyToClipboard(text);
        showNotification('Klíč zkopírován');
    }

    function clearAll() {
        currentExamples = [];
        currentKey = [];
        examplesDiv.innerHTML = '<div class="mw-empty">Klikni na "Generovat příklady"</div>';
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Eventy
    countMinus.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val > 5) countInput.value = val - 5;
    });
    
    countPlus.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val < 100) countInput.value = val + 5;
    });
    
    generateBtn.addEventListener('click', generateWorksheet);
    keyBtn.addEventListener('click', generateKey);
    clearBtn.addEventListener('click', clearAll);
    copyExamplesBtn.addEventListener('click', copyExamples);
    copyKeyBtn.addEventListener('click', copyKey);
    
    const saveElements = [addCheck, subCheck, mulCheck, divCheck, minInput, maxInput, countInput];
    saveElements.forEach(el => {
        if (el) el.addEventListener('change', saveSettings);
        if (el) el.addEventListener('input', saveSettings);
    });
    
    function saveSettings() {
        storage.set('add', addCheck.checked);
        storage.set('sub', subCheck.checked);
        storage.set('mul', mulCheck.checked);
        storage.set('div', divCheck.checked);
        storage.set('min', minInput.value);
        storage.set('max', maxInput.value);
        storage.set('count', countInput.value);
    }
    
    function loadSettings() {
        addCheck.checked = storage.get('add', true);
        subCheck.checked = storage.get('sub', true);
        mulCheck.checked = storage.get('mul', true);
        divCheck.checked = storage.get('div', true);
        minInput.value = storage.get('min', '1');
        maxInput.value = storage.get('max', '20');
        countInput.value = storage.get('count', '40');
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Math Worksheet se zavírá');
}