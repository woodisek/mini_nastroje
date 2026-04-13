import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('roman-numerals');

export default function render(container) {
    container.innerHTML = `
        <div class="roman-numerals">
            <div class="rn-header">
                <span class="rn-icon">🔢</span>
                <div>
                    <h3>Převod římských číslic</h3>
                    <p>Převod mezi arabskými a římskými číslicemi</p>
                </div>
            </div>

            <!-- Přepínání režimu -->
            <div class="rn-section">
                <div class="rn-modes">
                    <button data-mode="to-roman" class="rn-mode-btn active">➡️ Arabské → Římské</button>
                    <button data-mode="to-arabic" class="rn-mode-btn">⬅️ Římské → Arabské</button>
                </div>
            </div>

            <!-- Vstup -->
            <div class="rn-section">
                <label class="rn-label" id="rn-input-label">📝 Zadej arabské číslo (1-3999)</label>
                <div class="rn-input-group">
                    <input type="text" id="rn-input" class="rn-input" placeholder="např. 2024" value="2024">
                    <button id="rn-convert" class="rn-convert-btn">🔄 Převést</button>
                </div>
            </div>

            <!-- Výsledek -->
            <div class="rn-result-section">
                <div class="rn-result-header">
                    <span>📊 Výsledek</span>
                    <button id="rn-copy" class="rn-small-btn">📋 Kopírovat</button>
                    <button id="rn-clear" class="rn-small-btn">🗑️ Vyčistit</button>
                </div>
                <div id="rn-result" class="rn-result">
                    <div class="rn-empty">Zadej číslo a klikni na "Převést"</div>
                </div>
            </div>

            <!-- Info o římských číslicích -->
            <details class="rn-details">
                <summary>📖 Základní římské číslice</summary>
                <div class="rn-info">
                    <div class="rn-info-grid">
                        <div class="rn-info-item">I = 1</div>
                        <div class="rn-info-item">V = 5</div>
                        <div class="rn-info-item">X = 10</div>
                        <div class="rn-info-item">L = 50</div>
                        <div class="rn-info-item">C = 100</div>
                        <div class="rn-info-item">D = 500</div>
                        <div class="rn-info-item">M = 1000</div>
                    </div>
                    <div class="rn-info-note">
                        💡 Pravidla: I před V/X = odečítání (IV = 4, IX = 9)<br>
                        📏 Rozsah: 1 až 3999 (MMMCMXCIX)
                    </div>
                </div>
            </details>

            <!-- Tabulka běžných převodů -->
            <details class="rn-details">
                <summary>📋 Tabulka běžných převodů</summary>
                <div class="rn-common-table">
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">1</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">I</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">4</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">IV</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">5</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">V</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">9</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">IX</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">10</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">X</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">40</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">XL</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">50</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">L</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">90</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">XC</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">100</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">C</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">400</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">CD</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">500</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">D</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">900</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">CM</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">1000</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">M</span>
                    </div>
                    <div class="rn-common-row">
                        <span class="rn-common-arabic">2024</span>
                        <span class="rn-common-arrow">→</span>
                        <span class="rn-common-roman">MMXXIV</span>
                    </div>
                </div>
            </details>

            <!-- Tip -->
            <div class="rn-tip">
                💡 <strong>Tip:</strong> Římské číslice se používají pro letopočty, číslování kapitol, hodinky a další. Rozsah je 1-3999.
            </div>
        </div>
    `;

    // ========== POMOCNÉ FUNKCE ==========
    const romanMap = [
        { value: 1000, numeral: 'M' },
        { value: 900, numeral: 'CM' },
        { value: 500, numeral: 'D' },
        { value: 400, numeral: 'CD' },
        { value: 100, numeral: 'C' },
        { value: 90, numeral: 'XC' },
        { value: 50, numeral: 'L' },
        { value: 40, numeral: 'XL' },
        { value: 10, numeral: 'X' },
        { value: 9, numeral: 'IX' },
        { value: 5, numeral: 'V' },
        { value: 4, numeral: 'IV' },
        { value: 1, numeral: 'I' }
    ];

    const romanValues = {
        'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
    };

    function arabicToRoman(num) {
        if (num < 1 || num > 3999) return null;
        
        let result = '';
        let remaining = num;
        
        for (const { value, numeral } of romanMap) {
            while (remaining >= value) {
                result += numeral;
                remaining -= value;
            }
        }
        
        return result;
    }

    function romanToArabic(roman) {
        const upperRoman = roman.toUpperCase();
        let result = 0;
        let i = 0;
        
        for (let i = 0; i < upperRoman.length; i++) {
            const current = romanValues[upperRoman[i]];
            const next = romanValues[upperRoman[i + 1]];
            
            if (!current) return null;
            
            if (next && current < next) {
                result -= current;
            } else {
                result += current;
            }
        }
        
        if (result < 1 || result > 3999) return null;
        if (arabicToRoman(result) !== upperRoman) return null;
        
        return result;
    }

    // ========== DOM elementy ==========
    const modeBtns = document.querySelectorAll('.rn-mode-btn');
    const inputLabel = document.getElementById('rn-input-label');
    const inputEl = document.getElementById('rn-input');
    const convertBtn = document.getElementById('rn-convert');
    const copyBtn = document.getElementById('rn-copy');
    const clearBtn = document.getElementById('rn-clear');
    const resultDiv = document.getElementById('rn-result');

    let currentMode = 'to-roman';
    let currentResult = null;

    function convert() {
        const input = inputEl.value.trim();
        
        if (!input) {
            resultDiv.innerHTML = '<div class="rn-empty">Zadej hodnotu pro převod</div>';
            currentResult = null;
            return;
        }
        
        if (currentMode === 'to-roman') {
            const num = parseInt(input);
            if (isNaN(num)) {
                resultDiv.innerHTML = '<div class="rn-error">❌ Zadej platné číslo (1-3999)</div>';
                currentResult = null;
                return;
            }
            
            const roman = arabicToRoman(num);
            if (!roman) {
                resultDiv.innerHTML = '<div class="rn-error">❌ Číslo musí být v rozsahu 1-3999</div>';
                currentResult = null;
                return;
            }
            
            currentResult = roman;
            resultDiv.innerHTML = `
                <div class="rn-result-card">
                    <div class="rn-result-main">
                        <span class="rn-result-value">${roman}</span>
                        <span class="rn-result-label">římskými číslicemi</span>
                    </div>
                    <div class="rn-result-original">
                        ${num} → ${roman}
                    </div>
                </div>
            `;
            showNotification(`Převod: ${num} → ${roman}`, 'success');
        } else {
            const roman = input.toUpperCase();
            const arabic = romanToArabic(roman);
            
            if (!arabic) {
                resultDiv.innerHTML = '<div class="rn-error">❌ Neplatné římské číslice (I, V, X, L, C, D, M) v rozsahu 1-3999</div>';
                currentResult = null;
                return;
            }
            
            currentResult = arabic.toString();
            resultDiv.innerHTML = `
                <div class="rn-result-card">
                    <div class="rn-result-main">
                        <span class="rn-result-value">${arabic}</span>
                        <span class="rn-result-label">arabsky</span>
                    </div>
                    <div class="rn-result-original">
                        ${roman} → ${arabic}
                    </div>
                </div>
            `;
            showNotification(`Převod: ${roman} → ${arabic}`, 'success');
        }
        
        saveSettings();
    }

    async function copyResult() {
        if (!currentResult) {
            showNotification('Nejprve proveď převod', 'warning');
            return;
        }
        
        await copyToClipboard(currentResult);
        showNotification(`Zkopírováno: ${currentResult}`);
    }

    function clearAll() {
        inputEl.value = '';
        resultDiv.innerHTML = '<div class="rn-empty">Zadej číslo a klikni na "Převést"</div>';
        currentResult = null;
        showNotification('Vyčištěno');
        saveSettings();
    }

    function switchMode(mode) {
        currentMode = mode;
        
        modeBtns.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        if (mode === 'to-roman') {
            inputLabel.textContent = '📝 Zadej arabské číslo (1-3999)';
            inputEl.placeholder = 'např. 2024';
            inputEl.type = 'number';
            inputEl.step = '1';
            inputEl.min = '1';
            inputEl.max = '3999';
        } else {
            inputLabel.textContent = '📝 Zadej římské číslice (I-X, V, L, C, D, M)';
            inputEl.placeholder = 'např. MMXXIV';
            inputEl.type = 'text';
            inputEl.removeAttribute('step');
            inputEl.removeAttribute('min');
            inputEl.removeAttribute('max');
        }
        
        if (inputEl.value) {
            convert();
        }
        
        saveSettings();
    }

    // Eventy
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchMode(btn.dataset.mode);
        });
    });
    
    convertBtn.addEventListener('click', convert);
    copyBtn.addEventListener('click', copyResult);
    clearBtn.addEventListener('click', clearAll);
    
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') convert();
    });
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('mode', currentMode);
        storage.set('input', inputEl.value);
    }
    
    function loadSettings() {
        const savedMode = storage.get('mode', 'to-roman');
        const savedInput = storage.get('input', '');
        
        switchMode(savedMode);
        
        if (savedInput) {
            inputEl.value = savedInput;
            convert();
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Roman Numerals se zavírá');
}