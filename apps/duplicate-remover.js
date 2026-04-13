import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('duplicate-remover');

export default function render(container) {
    container.innerHTML = `
        <div class="duplicate-remover">
            <div class="dr-header">
                <span class="dr-icon">🔄</span>
                <div>
                    <h3>Odstraňovač duplicit</h3>
                    <p>Vyčisti seznam od duplicitních položek</p>
                </div>
            </div>

            <!-- Vstup a výstup vedle sebe -->
            <div class="dr-panels">
                <!-- Levý panel - Vstup -->
                <div class="dr-panel">
                    <div class="dr-panel-header">
                        <span>📥 Vstupní seznam</span>
                        <button id="dr-clear-input" class="dr-small-btn">🗑️ Vyčistit</button>
                    </div>
                    <textarea id="dr-input" class="dr-textarea" placeholder="Sem vlož seznam (jedna položka na řádek)...&#10;&#10;Např.:&#10;jablko&#10;hruška&#10;jablko&#10;banán&#10;hruška"></textarea>
                </div>

                <!-- Pravý panel - Výstup -->
                <div class="dr-panel">
                    <div class="dr-panel-header">
                        <span>📤 Výstupní seznam (bez duplicit)</span>
                        <div class="dr-panel-actions">
                            <button id="dr-copy-output" class="dr-small-btn">📋 Kopírovat</button>
                            <button id="dr-clear-output" class="dr-small-btn">🗑️ Vyčistit</button>
                        </div>
                    </div>
                    <textarea id="dr-output" class="dr-textarea" readonly placeholder="Zde se zobrazí seznam bez duplicit..."></textarea>
                </div>
            </div>

            <!-- Možnosti -->
            <div class="dr-section">
                <div class="dr-options">
                    <label class="dr-checkbox">
                        <input type="checkbox" id="dr-case-sensitive">
                        <span>🔤 Rozlišovat velikost písmen (Ahoj ≠ ahoj)</span>
                    </label>
                    <label class="dr-checkbox">
                        <input type="checkbox" id="dr-trim-lines">
                        <span>✂️ Oříznout mezery na začátku a konci řádků</span>
                    </label>
                    <label class="dr-checkbox">
                        <input type="checkbox" id="dr-remove-empty">
                        <span>🗑️ Odstranit prázdné řádky</span>
                    </label>
                    <label class="dr-checkbox">
                        <input type="checkbox" id="dr-sort">
                        <span>📊 Seřadit A-Z</span>
                    </label>
                </div>
            </div>

            <!-- Statistika -->
            <div class="dr-stats">
                <div class="dr-stat-card">
                    <div class="dr-stat-value" id="dr-original-count">0</div>
                    <div class="dr-stat-label">Původních položek</div>
                </div>
                <div class="dr-stat-card">
                    <div class="dr-stat-value" id="dr-unique-count">0</div>
                    <div class="dr-stat-label">Unikátních položek</div>
                </div>
                <div class="dr-stat-card">
                    <div class="dr-stat-value" id="dr-removed-count">0</div>
                    <div class="dr-stat-label">Odstraněno duplicit</div>
                </div>
            </div>

            <!-- Akce -->
            <div class="dr-actions">
                <button id="dr-process" class="dr-btn dr-btn-primary">✨ Vyčistit data</button>
            </div>

            <!-- Tip -->
            <div class="dr-tip">
                💡 <strong>Tip:</strong> Každá položka musí být na samostatném řádku. Můžeš vložit seznam z Excelu nebo Google Sheets.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const inputEl = document.getElementById('dr-input');
    const outputEl = document.getElementById('dr-output');
    const processBtn = document.getElementById('dr-process');
    const copyOutputBtn = document.getElementById('dr-copy-output');
    const clearInputBtn = document.getElementById('dr-clear-input');
    const clearOutputBtn = document.getElementById('dr-clear-output');
    
    const caseSensitiveCheck = document.getElementById('dr-case-sensitive');
    const trimLinesCheck = document.getElementById('dr-trim-lines');
    const removeEmptyCheck = document.getElementById('dr-remove-empty');
    const sortCheck = document.getElementById('dr-sort');
    
    const originalCountSpan = document.getElementById('dr-original-count');
    const uniqueCountSpan = document.getElementById('dr-unique-count');
    const removedCountSpan = document.getElementById('dr-removed-count');
    
    function processDuplicates() {
        let lines = inputEl.value.split(/\r?\n/);
        
        // Oříznutí mezer
        if (trimLinesCheck.checked) {
            lines = lines.map(line => line.trim());
        }
        
        // Odstranění prázdných řádků
        if (removeEmptyCheck.checked) {
            lines = lines.filter(line => line.length > 0);
        }
        
        const originalCount = lines.length;
        
        // Odstranění duplicit
        let unique;
        if (caseSensitiveCheck.checked) {
            // Rozlišovat velikost písmen
            const seen = new Set();
            unique = lines.filter(line => {
                if (seen.has(line)) return false;
                seen.add(line);
                return true;
            });
        } else {
            // Nerozlišovat velikost písmen
            const seen = new Map();
            unique = lines.filter(line => {
                const lower = line.toLowerCase();
                if (seen.has(lower)) return false;
                seen.set(lower, line);
                return true;
            });
        }
        
        // Řazení
        if (sortCheck.checked) {
            unique.sort((a, b) => {
                const aVal = caseSensitiveCheck.checked ? a : a.toLowerCase();
                const bVal = caseSensitiveCheck.checked ? b : b.toLowerCase();
                if (aVal < bVal) return -1;
                if (aVal > bVal) return 1;
                return 0;
            });
        }
        
        const uniqueCount = unique.length;
        const removedCount = originalCount - uniqueCount;
        
        // Aktualizace statistik
        originalCountSpan.textContent = originalCount;
        uniqueCountSpan.textContent = uniqueCount;
        removedCountSpan.textContent = removedCount;
        
        // Zobrazení výsledku
        outputEl.value = unique.join('\n');
        
        // Notifikace
        if (removedCount > 0) {
            showNotification(`Odstraněno ${removedCount} duplicit`, 'success');
        } else if (originalCount > 0) {
            showNotification('Žádné duplicity nenalezeny', 'info');
        }
    }
    
    async function copyOutput() {
        const text = outputEl.value;
        if (text) {
            await copyToClipboard(text);
        } else {
            showNotification('Žádný text ke kopírování', 'warning');
        }
    }
    
    function clearInput() {
        inputEl.value = '';
        processDuplicates();
        showNotification('Vstup vyčištěn');
    }
    
    function clearOutput() {
        outputEl.value = '';
        originalCountSpan.textContent = '0';
        uniqueCountSpan.textContent = '0';
        removedCountSpan.textContent = '0';
        showNotification('Výstup vyčištěn');
    }
    
    // Auto-process při změně vstupu (debounce)
    let debounceTimer;
    function autoProcess() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (inputEl.value.trim()) {
                processDuplicates();
            } else {
                outputEl.value = '';
                originalCountSpan.textContent = '0';
                uniqueCountSpan.textContent = '0';
                removedCountSpan.textContent = '0';
            }
        }, 300);
    }
    
    // Eventy
    inputEl.addEventListener('input', autoProcess);
    processBtn.addEventListener('click', processDuplicates);
    copyOutputBtn.addEventListener('click', copyOutput);
    clearInputBtn.addEventListener('click', clearInput);
    clearOutputBtn.addEventListener('click', clearOutput);
    
    caseSensitiveCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) processDuplicates();
        saveSettings();
    });
    trimLinesCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) processDuplicates();
        saveSettings();
    });
    removeEmptyCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) processDuplicates();
        saveSettings();
    });
    sortCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) processDuplicates();
        saveSettings();
    });
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('caseSensitive', caseSensitiveCheck.checked);
        storage.set('trimLines', trimLinesCheck.checked);
        storage.set('removeEmpty', removeEmptyCheck.checked);
        storage.set('sort', sortCheck.checked);
        storage.set('input', inputEl.value);
    }
    
    function loadSettings() {
        caseSensitiveCheck.checked = storage.get('caseSensitive', false);
        trimLinesCheck.checked = storage.get('trimLines', true);
        removeEmptyCheck.checked = storage.get('removeEmpty', true);
        sortCheck.checked = storage.get('sort', false);
        
        const savedInput = storage.get('input', '');
        if (savedInput) {
            inputEl.value = savedInput;
            setTimeout(() => processDuplicates(), 100);
        }
    }
    
    caseSensitiveCheck.addEventListener('change', saveSettings);
    trimLinesCheck.addEventListener('change', saveSettings);
    removeEmptyCheck.addEventListener('change', saveSettings);
    sortCheck.addEventListener('change', saveSettings);
    inputEl.addEventListener('input', saveSettings);
    
    loadSettings();
}

export function cleanup() {
    console.log('Duplicate Remover se zavírá');
}