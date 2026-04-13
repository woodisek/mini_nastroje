import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('sheets-formatter-pro');

export default function render(container) {
    container.innerHTML = `
        <div class="sheets-formatter-pro">
            <div class="sfp-header">
                <span class="sfp-icon">📊</span>
                <div>
                    <h3>Google Sheets Formatter</h3>
                    <p>Naformátuj text pro snadné vložení do tabulek</p>
                </div>
            </div>

            <!-- Vstup -->
            <div class="sfp-section">
                <label class="sfp-label">📝 Vstupní text</label>
                <textarea id="sfp-input" class="sfp-textarea" rows="6" placeholder="Sem vlož text...&#10;&#10;Např.: jméno,email,telefon&#10;Jan,novak@email.cz,777123456&#10;&#10;Nebo zkopíruj rovnou z Excelu / Sheets"></textarea>
                <div class="sfp-hint">💡 Tabulátor (Tab) vkládá mezeru • Automatické formátování při psaní</div>
            </div>

            <!-- Nastavení -->
            <div class="sfp-section">
                <label class="sfp-label">⚙️ Nastavení</label>
                
                <div class="sfp-row">
                    <div class="sfp-input-group">
                        <span class="sfp-input-label">Oddělovač</span>
                        <select id="sfp-delimiter" class="sfp-select">
                            <option value="auto">🔍 Automaticky (detekuje sám)</option>
                            <option value="comma">, (čárka)</option>
                            <option value="tab">↹ (tabulátor)</option>
                            <option value="semicolon">; (středník)</option>
                            <option value="pipe">| (svislítko)</option>
                            <option value="custom">⚙️ Vlastní</option>
                        </select>
                    </div>
                    <div id="sfp-custom-wrapper" class="sfp-custom-wrapper" style="display: none;">
                        <input type="text" id="sfp-custom" class="sfp-input" placeholder="Zadej vlastní oddělovač (např. | nebo ;)" maxlength="3">
                    </div>
                </div>

                <div class="sfp-options">
                    <label class="sfp-checkbox">
                        <input type="checkbox" id="sfp-transpose">
                        <span>🔄 Otočit (řádky ↔ sloupce)</span>
                        <small>Transpozice tabulky</small>
                    </label>
                    <label class="sfp-checkbox">
                        <input type="checkbox" id="sfp-trim" checked>
                        <span>✂️ Oříznout mezery</span>
                        <small>Odstraní mezery na začátku a konci každé buňky (např. "  ahoj  " → "ahoj")</small>
                    </label>
                    <label class="sfp-checkbox">
                        <input type="checkbox" id="sfp-remove-empty">
                        <span>🗑️ Odstranit prázdné hodnoty</span>
                        <small>Smaže prázdné buňky (např. "a,,c" → "a,c")</small>
                    </label>
                </div>
            </div>

            <!-- Statistika -->
            <div class="sfp-stats">
                <div class="sfp-stat-card">
                    <div class="sfp-stat-value" id="sfp-rows">0</div>
                    <div class="sfp-stat-label">řádků</div>
                </div>
                <div class="sfp-stat-card">
                    <div class="sfp-stat-value" id="sfp-cols">0</div>
                    <div class="sfp-stat-label">sloupců</div>
                </div>
                <div class="sfp-stat-card">
                    <div class="sfp-stat-value" id="sfp-cells">0</div>
                    <div class="sfp-stat-label">buněk</div>
                </div>
            </div>

            <!-- Výstup -->
            <div class="sfp-section">
                <div class="sfp-output-header">
                    <label class="sfp-label">📋 Výstup (pro kopírování do Sheets)</label>
                    <button id="sfp-copy" class="sfp-small-btn">📋 Kopírovat</button>
                </div>
                <textarea id="sfp-output" class="sfp-textarea sfp-output" rows="6" readonly placeholder="Zde se zobrazí naformátovaný text..."></textarea>
                <div class="sfp-hint">💡 Výstup je formátovaný tabulátory – stačí kopírovat a vložit do Google Sheets</div>
            </div>

            <!-- Tlačítka -->
            <div class="sfp-buttons">
                <button id="sfp-clear" class="sfp-btn sfp-btn-secondary">🗑️ Vyčistit vše</button>
            </div>

            <!-- Tip -->
            <div class="sfp-tip">
                💡 <strong>Tip:</strong> Stačí vložit text, vybrat oddělovač a výsledek je připraven k vložení do Google Sheets. Funkce "Otočit" prohodí řádky a sloupce.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const inputEl = document.getElementById('sfp-input');
    const outputEl = document.getElementById('sfp-output');
    const delimiterSelect = document.getElementById('sfp-delimiter');
    const customWrapper = document.getElementById('sfp-custom-wrapper');
    const customInput = document.getElementById('sfp-custom');
    const transposeCheck = document.getElementById('sfp-transpose');
    const trimCheck = document.getElementById('sfp-trim');
    const removeEmptyCheck = document.getElementById('sfp-remove-empty');
    const copyBtn = document.getElementById('sfp-copy');
    const clearBtn = document.getElementById('sfp-clear');
    const rowsSpan = document.getElementById('sfp-rows');
    const colsSpan = document.getElementById('sfp-cols');
    const cellsSpan = document.getElementById('sfp-cells');

    let currentFormatted = '';

    // Vložení tabulátoru
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = inputEl.selectionStart;
            const end = inputEl.selectionEnd;
            const value = inputEl.value;
            inputEl.value = value.substring(0, start) + '\t' + value.substring(end);
            inputEl.selectionStart = inputEl.selectionEnd = start + 1;
        }
    });

    // Detekce oddělovače
    function detectDelimiter(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length === 0) return null;
        const sample = lines[0];
        const delimiters = [',', '\t', ';', '|'];
        let best = null;
        let max = 0;
        for (const d of delimiters) {
            const count = (sample.match(new RegExp(`\\${d}`, 'g')) || []).length;
            if (count > max && count > 0) {
                max = count;
                best = d;
            }
        }
        return best;
    }

    function getDelimiter() {
        const type = delimiterSelect.value;
        if (type === 'auto') return null;
        if (type === 'comma') return ',';
        if (type === 'tab') return '\t';
        if (type === 'semicolon') return ';';
        if (type === 'pipe') return '|';
        if (type === 'custom') return customInput.value || ',';
        return ',';
    }

    // Transpozice matice
    function transposeMatrix(matrix) {
        if (!matrix.length) return [];
        const rows = matrix.length;
        const cols = Math.max(...matrix.map(row => row.length));
        
        const result = [];
        for (let c = 0; c < cols; c++) {
            result[c] = [];
            for (let r = 0; r < rows; r++) {
                result[c][r] = matrix[r][c] !== undefined ? matrix[r][c] : '';
            }
        }
        return result;
    }

    function formatText() {
        const input = inputEl.value;
        if (!input.trim()) {
            outputEl.value = '';
            rowsSpan.textContent = '0';
            colsSpan.textContent = '0';
            cellsSpan.textContent = '0';
            currentFormatted = '';
            return;
        }
        
        let delimiter = getDelimiter();
        let lines = input.split(/\r?\n/);
        
        if (delimiter === null) {
            delimiter = detectDelimiter(input) || ',';
        }
        
        const trim = trimCheck.checked;
        const removeEmpty = removeEmptyCheck.checked;
        const transpose = transposeCheck.checked;
        
        // Parsování na matici
        let matrix = lines.map(line => {
            if (trim) line = line.trim();
            if (!line && removeEmpty) return null;
            
            let cells = line.split(delimiter);
            if (trim) cells = cells.map(c => c.trim());
            if (removeEmpty) cells = cells.filter(c => c !== '');
            
            return cells;
        }).filter(row => row !== null);
        
        // Transpozice
        if (transpose) {
            matrix = transposeMatrix(matrix);
        }
        
        // Výpočet statistik
        const rows = matrix.length;
        const cols = rows > 0 ? Math.max(...matrix.map(row => row.length)) : 0;
        const totalCells = matrix.reduce((sum, row) => sum + row.length, 0);
        
        rowsSpan.textContent = rows;
        colsSpan.textContent = cols;
        cellsSpan.textContent = totalCells;
        
        // Formátování výstupu
        currentFormatted = matrix.map(row => row.join('\t')).join('\n');
        outputEl.value = currentFormatted;
    }

    async function copyResult() {
        if (currentFormatted) {
            await copyToClipboard(currentFormatted);
            showNotification('Text zkopírován do schránky');
        } else {
            showNotification('Žádný text ke kopírování', 'warning');
        }
    }

    function clearAll() {
        inputEl.value = '';
        outputEl.value = '';
        currentFormatted = '';
        rowsSpan.textContent = '0';
        colsSpan.textContent = '0';
        cellsSpan.textContent = '0';
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Eventy pro automatické formátování
    const autoFormat = () => formatText();
    
    inputEl.addEventListener('input', autoFormat);
    delimiterSelect.addEventListener('change', () => {
        customWrapper.style.display = delimiterSelect.value === 'custom' ? 'block' : 'none';
        formatText();
        saveSettings();
    });
    customInput.addEventListener('input', () => {
        formatText();
        saveSettings();
    });
    transposeCheck.addEventListener('change', () => {
        formatText();
        saveSettings();
    });
    trimCheck.addEventListener('change', () => {
        formatText();
        saveSettings();
    });
    removeEmptyCheck.addEventListener('change', () => {
        formatText();
        saveSettings();
    });
    
    copyBtn.addEventListener('click', copyResult);
    clearBtn.addEventListener('click', clearAll);
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('delimiter', delimiterSelect.value);
        storage.set('customDelimiter', customInput.value);
        storage.set('transpose', transposeCheck.checked);
        storage.set('trim', trimCheck.checked);
        storage.set('removeEmpty', removeEmptyCheck.checked);
        storage.set('input', inputEl.value);
    }
    
    function loadSettings() {
        delimiterSelect.value = storage.get('delimiter', 'auto');
        customInput.value = storage.get('customDelimiter', '');
        transposeCheck.checked = storage.get('transpose', false);
        trimCheck.checked = storage.get('trim', true);
        removeEmptyCheck.checked = storage.get('removeEmpty', false);
        
        const savedInput = storage.get('input', '');
        if (savedInput) {
            inputEl.value = savedInput;
            setTimeout(() => formatText(), 50);
        }
        
        if (delimiterSelect.value === 'custom') {
            customWrapper.style.display = 'block';
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Sheets Formatter Pro se zavírá');
}